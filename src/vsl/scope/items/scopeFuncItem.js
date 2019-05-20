import ScopeItem from '../scopeItem';
import ScopeForm from '../scopeForm';

import TypeContextConnector from '../TypeContextConnector';

/**
 * Describes a function declaration. Usually a top, nested, or class-level
 * declaration.
 */
export default class ScopeFuncItem extends ScopeItem {

    /**
     * Creates a spot for a function in a scope. Use this when you need to
     * handle overloading etc. For lambdas you probably want to use a normal
     *
     * @param {ScopeForm} form - The form or type of the scope item.
     * @param {string} rootId - the root identifier in a scope.
     * @param {Object} data - Information about the class. See {@link ScopeItem}
     * @param {ScopeFuncItemArgument[]} data.args - The arguments passable.
     * @param {?ScopeTypeItem} [data.returnType=null] - Return type of function
     *                                                or null fpr void.
     */
    constructor(form, rootId, data) {
        super(form, rootId, data);
    }

    /** @override */
    init({ args, returnType = null, ...opts }) {
        super.init(opts);

        /**
         * The list of arguments that a function has.
         * @type {ScopeFuncItemArgument[]}
         */
        this.args = args;

        /**
         * The return type of the function if it returns.
         * @type {?ScopeTypeItem}
         */
        this.returnType = returnType;

        /**
         * Specifies if the function should be inlined by the backend
         * @type {boolean}
         */
        this.shouldInline = false;

        this._shouldForceInline = false;

        this._virtualParentMethod = null;

        /**
         * The relative access modifier of the function. This can be:
         *
         *  - public
         *  - local
         *  - protected
         *  - private
         *
         * @type {string}
         */
        this.accessModifier = 'local';

        /**
         * Foreign function name
         * @type {string}
         */
        this.foreignName = null;

        this._overriddenBy = [];

        this._isImplementationDefinite = true;
    }

    /**
     * Get all functions which this is overridden by. Only applies to TOP
     * level function
     * @type {ScopeFuncItem[]}
     */
    get overriddenBy() {
        return this._overriddenBy;
    }

    /**
     * Adds a new function that overrides this
     * @param {ScopeFuncItem} func - Function that overrides this definite.
     */
    addFunctionWhichOverrides(func) {
        this._isImplementationDefinite = false;

        // If there _this_ overrides _parent_ then _func_ actually overrides
        // _parent_
        if (this._virtualParentMethod) {
            this._virtualParentMethod.addFunctionWhichOverrides(func);
        } else {
            // Otherwise it overrides this.
            this._overriddenBy.push(func);

            // And then _this_ is what _func_ overrides
            func._virtualParentMethod = this;

            // If there was anything which supposedly overrode 'func' it now
            // overrides 'this'
            this._overriddenBy.push(...func._overriddenBy);

            // Set all child virtual parent methods to this.
            function setVirtualParents(subfunc) {
                for (let i = 0; i < subfunc._overriddenBy.length; i++) {
                    subfunc._overriddenBy[i]._virtualParentMethod = this;
                    setVirtualParents(subfunc._overriddenBy[i]);
                }
            }

            setVirtualParents(func);

            func._overriddenBy = [];
        }
    }

    /**
     * Specifies the function which this overrides. Set this using
     * addFunctionWhichOverrides. This is itself if it doesn't override anything
     * @type {ScopeFuncItem}
     */
    get virtualParentMethod() {
        return this._virtualParentMethod || this;
    }

    /**
     * Specifies if the function does overrides some other function.
     * @type {boolean}
     */
    get isDynamic() {
        // If this is 1) overriden by something 2) overrides something. then it
        // is dynamic.
        return this._overriddenBy.length > 0 || this._virtualParentMethod;
    }

    /**
     * Returns if this function is dynamic but does not override anything. This
     * is significant because this is the original method which is overriden
     * by its subclasses.
     * @type {boolean}
     */
    get isRootDynamic() {
        // If there is no parent then it's root
        return this._overriddenBy.length > 0 && !this._virtualParentMethod;
    }

    /**
     * If inline should be forced. This is never true if
     * {@link ScopeFuncItem#shouldInline} is ever false.
     * @type {boolean}
     */
    get shouldForceInline() {
        return this.shouldInline && this._shouldForceInline;
    }

    /**
     * If a method is not personally overridden, this will store if so that way
     * an extra vtable is not needed.
     * @type {boolean}
     */
    get implementationIsDefinite() {
        return this._isImplementationDefinite;
    }

    /**
     * If inline should be forced.
     * @type {boolean}
     */
    set shouldForceInline(shouldForceInline) {
        this._shouldForceInline = shouldForceInline;
    }

    /** @override */
    clone(opts) {
        super.clone({
            args: this.args.map(arg => arg.clone()),
            source: this.source,
            returnType: this.returnType,
            ...opts
        })
    }

    /** @override */
    equal(ref: ScopeItem): boolean {
        // Check super condition
        // We will do extra disambiguation here
        if (super.equal(ref) === false) return false;
        if (!(ref instanceof ScopeFuncItem)) return false;

        // TODO: If optional args this must be changed
        // This requires the same arg length as a query.
        let matchArgs = ref.query.args;

        // Different amount of args means different
        if (matchArgs.length !== this.args.length) return false;

        // Next we must check that all the arg types have different names and
        // are not castable to this.
        for (let i = 0; i < this.args.length; i++) {
            let queryArg = matchArgs[i];
            let baseArg = this.args[i];

            let queryType = queryArg.getType().resolved();
            let selfType = baseArg.getType().resolved();

            // Checks if the 2 args are the same (or related)
            let typesAreAmbiguous = (
                queryType.castableTo(selfType) ||
                selfType.castableTo(queryType)
            );

            let argIsMatching = queryArg.name === baseArg.name && typesAreAmbiguous;

            // If an arg does not match we know 100% it is not equal
            if (!argIsMatching) return false;
        }

        return true;
    }


    /**
     * If function is generic. This returns true if:
     *  - Function is method or static method of generic class
     * @type {boolean}
     */
    get isGeneric() {
        if (this.owner?.owner?.isGeneric) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * @override
     * @return {ScopeFuncItem}
     */
    getQuery() {
        return new (this.constructor)(ScopeForm.query, this.rootId, {
            args: this.args
        });
    }

    /**
     * Returns unique name for scope item
     * @type {string}
     */
    get uniqueName() {
        return `F${super.uniqueName}${this.args.map(arg => arg.uniqueName).join("")}`;
    }

    /**
     * Returns human-readable description of type.
     * @type {string}
     * @override
     */
    get typeDescription() { return 'Function'; }

    /** @override */
    toString() {
        return `func ${this.rootId}(${this.args.join(", ")}) -> ${this.returnType || "Void"}`;
    }
}
