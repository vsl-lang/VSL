import ScopeItem from '../scopeItem';
import ScopeForm from '../scopeForm';

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
     * @param {Object} data - Information about the class
     */
    constructor(form, rootId, data) {
        super(form, rootId, data);

        /**
         * The list of arguments that a function has.
         * @type {ScopeFuncItemArgument[]}
         */
        this.args;

        /**
         * The return type of the function if it returns.
         * @type {?ScopeTypeItem}
         */
        this.returnType;

        /**
         * If this item has been generated by a backend yet.
         */
        this.generated;

        /**
         * The original referencing node.
         * @type {Node}
         */
        this.source;

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
        this.accessModifier;
    }

    /** @override */
    init({ args, source, returnType = null, ...opts }) {
        super.init(opts);
        this.args = args;
        this.source = source;
        this.returnType = returnType?.resolved();

        this.generated = false;

        // Default access modifier
        this.accessModifier = 'local';
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

            let argIsMatching = queryArg.name.value === baseArg.name.value && typesAreAmbiguous;

            // If an arg does not match we know 100% it is not equal
            if (!argIsMatching) return false;
        }

        return true;
    }

    /**
     * @override
     * @return {ScopeFuncItem}
     */
    getQuery() {
        return new ScopeFuncItem(ScopeForm.query, this.rootId, {
            args: this.args
        });
    }

    /** @override */
    toString() {
        return `func ${this.rootId}(${this.args.join(", ")})`;
    }
}
