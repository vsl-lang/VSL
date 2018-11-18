import ScopeForm from '../scopeForm';
import ScopeItem from '../scopeItem';

import Scope from '../scope';

/**
 * @typedef {Object} ScopeTypeItemOptions
 * @property {?(ScopeTypeItem[])} data.interfaces - Types which this can safely
 *     be cast to. We'll assume that you've done all the checks because if
 *     something is wrong here expect big giant segfaults. If you have a
 *     superclass, specified it'll just go in the superclass field.
 *     Interfaces go here for example.
 * @property {?ScopeTypeItem} data.superclass - The superclass (not interface)
 *     of the current class, don't specify if there is none. You don't need
 *     to resolve inheritance or anything. This is null for interfaces.
 * @property {boolean} data.isInterface - Whether the type is an interface.
 *     This is used to determine how casting will occur and dynamic dispatch
 *     so ensure that it is not possible to declare fields.
 * @property {Scope} data.subscope - The scope the class manages.
 * @property {ScopeItemResolver} data.resolver - Function to resolve if node.
 * @property {string} data.mockType - A property for backends if the type needs
 *                                  to act like a native type. ANY fields will
 *                                  likely be ignored.
 * @property {?GenericInfo} data.genericInfo - Can be `null`. This is info
 *                                           specifying how generic params do.
 */

/**
 * Describes a declaration of a type.
 */
export default class ScopeTypeItem extends ScopeItem {
    /**
     * Creates an intenral declaration of a type. When passing the "subscope",
     * don't create a new one or anything, just pass the `CodeBlock`'s `Scope`
     * that your node has. If for some weird reason you need to create a scope,
     * don't set the `parentScope` of the scope, the `superclass` attribute will
     * do that for you.
     *
     * @param {ScopeForm} form - The form or type of the scope item.
     * @param {string} rootId - the root identifier in a scope.
     * @param {ScopeTypeItemOptions} data - Information about the class
     */
    constructor(form, rootId, options) {
        super(form, rootId, options);

        /**
         * Types which this can safely be cast to. We'll assume that you've done
         * all the checks because if something is wrong here expect big giant
         * segfaults. If you have a superclass, specified it'll just go in the
         * superclass field. Interfaces go here for example.
         * @type {?(ScopeTypeItem[])}
         */
        this.interfaces;

        /**
         * The single superclass defaulting to the root class. The superclass
         * (not interface) of the current class, don't specify if there is none.
         * You don't need to resolve inheritance or anything. This is null for
         * interfaces.
         * @type {ScopeTypeItem}
         */
        this.superclass;

        /**
         * Specifies static scope for a type
         * @type {Scope}
         */
        this.staticScope;

        /**
         * Specifies the subscope for the function.
         * @type {Scope}
         */
        this.subscope;

        /**
         * Whether the type is an interface. This is used to determine how
         * casting will occur and dynamic dispatch so ensure that it is not
         * possible to declare fields.
         * @type {Boolean}
         */
        this.isInterface;

        /**
         * A property for backends if the type needs to act like a native type.
         * ANY fields will likely be ignored.
         * @type {string}
         */
        this.mockType;

        /**
         * If a type explicitly is unqualified for dynamic dispatch.
         * @param {boolean}
         */
        this._dynamicDispatch;

        /**
         * The default initializer if needed
         * @type {?ScopeInitItem}
         */
        this.defaultInitializer;

        /**
         * Specifies the source node of the type.
         * @type {?Node}
         */
        this.source;

        /**
         * The generic info
         * @type {GenericInfo}
         */
        this.genericInfo;
    }

    /**
     * Sets if dynamic dispatch should be used for the function. Do note that
     * this cannot be overided after initially set. If the `@dynamic(false)`
     * annotation is used, dynamic dispatch is disabled and cannot be
     * re-enabled. Do not explicitly set to `false` unless you want to eradicate
     * the posibility of dynamic dispatch for the type.
     * @type {boolean}
     */
    set dynamicDispatch(state) {
        if (this._dynamicDispatch === null) {
            this._dynamicDispatch = state;
        }
    }

    /**
     * Returns if generic
     * @type {boolean}
     */
    get isGeneric() {
        return this.genericInfo && this.genericInfo.parameters.length > 0;
    }

    /**
     * Obtains the dynamic dispatch state. This is not automatically determined
     * at all. You must set this. This only manages unset values, in which case
     * the state defaults to `false`.
     * @type {boolean}
     */
    get dynamicDispatch() {
        return this._dynamicDispatch || false;
    }

    /** @protected */
    init({
        interfaces = [],
        superclass = ScopeTypeItem.RootClass,
        isInterface = false,
        mockType = null,
        staticScope,
        subscope,
        source = null,
        dynamicDispatch = null,
        defaultInitializer = null,
        genericInfo,
        ...opts
    } = {}) {
        super.init(opts);

        this.interfaces = interfaces;
        this.superclass = superclass;
        this.isInterface = isInterface;
        this.staticScope = staticScope;
        this.subscope = subscope;
        this.mockType = mockType;
        this._dynamicDispatch = dynamicDispatch;
        this.source = source;
        this.genericInfo = genericInfo;

        this.defaultInitializer = defaultInitializer;
    }

    /**
     * Determines if the current type can be cast to `type` is castable.
     *
     * @param {ScopeTypeItem} type - If the current type can be cast to this
     *                             type.
     * @return {number} can be treated as a boolean. 0 if cannot be cast, else,
     *                  this is the distance of the cast (lower = more specific)
     */
    castableTo(type) {
        type = type.resolved();

        // Check if cast to the same type
        if (type === this) return 1;

        // Check if casting to new type
        let canCastSuperclass = this.superclass?.castableTo(type);
        if (canCastSuperclass) return canCastSuperclass + 1;

        // Check if any of the interfaces can cast to `type`
        for (let i = 0; i < this.interfaces; i++) {
            let canCastInterface = this.interfaces[i].castableTo(type);
            if (canCastInterface) {
                return canCastInterface + 1;
            }
        }

        return 0;
    }

    /**
     * Returns the type in a context. Can be used to resolve generic.
     * @param {TypeContext} typeContext
     * @return {ScopeTypeItem} may return a different class FYI.
     */
    contextualType(typeContext) {
        return this;
    }

    /** @override */
    equal(ref: ScopeItem): boolean {
        // Only the names need to be equal except for inits
        if (this.rootId !== ref.rootId) return false;
        return true;
    }

    /**
     * The default classes all items inherit from.
     */
    static RootClass = do {
        new ScopeTypeItem(ScopeForm.definite, "Object", {
            superclass: null,
            subscope: new Scope(),
            staticScope: new Scope()
        });
    }

    /**
     * Returns unique name for scope item
     * @type {string}
     */
    get uniqueName() {
        return `T${this.isInterface ? "I" : "C"}${this.rootId}`;
    }

    /** @override */
    clone(opts) {
        super.clone({
            interfaces: this.interfaces,
            superclass: this.superclass,
            isInterface: this.isInterface,
            staticScope: this.staticScope,
            subscope: this.subscope,
            mockType: this.mockType,
            dynamicDispatch: this._dynamicDispatch,
            source: source,
            defaultInitializer: defaultInitializer
        });
    }

    /**
     * Get descriptive name
     * @return {string}
     */
    get description() {
        return `${this.isInterface ? "interface" : "class"} ${this.rootId}`
    }

    /** @return {string} */
    toString() {
        return `${this.rootId}`
    }
}
