import ScopeForm from '../scopeForm';
import ScopeItem from '../scopeItem';
import TypeContext from '../TypeContext';

import GenericInfo from './genericInfo';

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
 * @property {boolean} data.isByValue - If type represents a by-value type
 * @property {string} data.mockType - A property for backends if the type needs
 *                                  to act like a native type. ANY fields will
 *                                  likely be ignored.
 * @property {?GenericInfo} data.genericInfo - Can be `null`. This is info
 *                                           specifying how generic params do.
 * @property {?ScopeTypeItem} data.selfType - If this is a generic. Set this to
 *                                          `genericInfo.parameters`. Else this
 *                                          defaults to `this`.
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
        return this.genericInfo.isGeneric;
    }

    /**
     * Obtains the dynamic dispatch state. This is not automatically determined
     * at all. You must set this. This only manages unset values, in which case
     * the state defaults to `false`. This basically specifies if the class
     * should have vtable.
     * @type {boolean}
     */
    get dynamicDispatch() {
        if (this._dynamicDispatch !== null) {
            return this._dynamicDispatch;
        }

        let isDynamic = false;
        const methods = this.subscope.functions;
        for (let i = 0; i < methods.length; i++) {
            if (methods[i].isRootDynamic) {
                isDynamic = true;
                break;
            }
        }

        return isDynamic;
    }

    /**
     * Gets all the functions which are the original dynamic declarations.
     * @return {ScopeFuncItem}
     */
    *rootDynamicMethods() {
        let methods = this.subscope.functions;

        for (let i = 0; i < methods.length; i++) {
            if (methods[i].isRootDynamic) {
                yield methods[i];
            }
        }
    }

    /**
     * Gets all the functions which are a dynamic declarations.
     * @return {ScopeFuncItem}
     */
    *dynamicMethods() {
        let methods = this.subscope.functions;

        for (let i = 0; i < methods.length; i++) {
            if (methods[i].isDynamic) {
                yield methods[i];
            }
        }
    }

    /** @protected */
    init({
        interfaces = [],
        superclass,
        isInterface = false,
        mockType = null,
        staticScope,
        subscope,
        isByValue = false,
        source = null,
        dynamicDispatch = null,
        defaultInitializer = null,
        genericInfo,
        selfType,
        ...opts
    } = {}) {
        super.init(opts);

        /**
         * Types which this can safely be cast to. We'll assume that you've done
         * all the checks because if something is wrong here expect big giant
         * segfaults. If you have a superclass, specified it'll just go in the
         * superclass field. Interfaces go here for example.
         * @type {?(ScopeTypeItem[])}
         */
        this.interfaces = interfaces;

        /**
         * The single superclass defaulting to the root class. The superclass
         * (not interface) of the current class, don't specify if there is none.
         * You don't need to resolve inheritance or anything. This is null for
         * interfaces.
         * @type {ScopeTypeItem}
         */
        this.superclass = superclass || ScopeTypeItem.RootClass;

        /**
         * Whether the type is an interface. This is used to determine how
         * casting will occur and dynamic dispatch so ensure that it is not
         * possible to declare fields.
         * @type {Boolean}
         */
        this.isInterface = isInterface;

        /**
         * If the type is a by-value type,
         * @type {boolean}
         */
        this.isByValue = isByValue;

        /**
         * Specifies static scope for a type
         * @type {Scope}
         */
        this.staticScope = staticScope;

        /**
         * Specifies the subscope for the function.
         * @type {Scope}
         */
        this.subscope = subscope;

        /**
         * List of subclasses.
         * @type {ScopeTypeItem[]}
         */
        this.subclasses = [];

        /**
         * A property for backends if the type needs to act like a native type.
         * ANY fields will likely be ignored.
         * @type {string}
         */
        this.mockType = mockType;

        this._dynamicDispatch = dynamicDispatch;

        /**
         * Specifies the source node of the type.
         * @type {?Node}
         */
        this.source = source;

        /**
         * The generic info
         * @type {GenericInfo}
         */
        this.genericInfo = genericInfo || new GenericInfo({
            parameters: []
        });

        /**
         * Refers to the type of a `self`. This may differ from the current
         * `ScopeTypeItem` object in the case of generics.
         * @type {ScopeTypeItem}
         */
        this.selfType = this;

        /**
         * The default initializer if needed
         * @type {?ScopeInitItem}
         */
        this.defaultInitializer = defaultInitializer;

        /**
         * The implicit initializer. This is either equal to default initializer
         * or is the initializer that takes no args.
         * @type {?ScopeInitItem}
         */
        this.implicitInitializer = defaultInitializer;
    }

    /**
     * Gets an array of superclass stack. A -> B -> C -> D. Returns empty array
     * if interface even if interface has a superinterface. Does not include
     * current node. This is sorted from highest class to lowest class. Object
     * is not included.
     * @type {ScopeTypeItem[]}
     */
    get superclassStack() {
        const stack = [this.superclass];

        let nextStackItem;
        while ((nextStackItem = stack[stack.length - 1]).hasSuperClass) {
            stack.unshift(nextStackItem.superclass);
        }

        return stack;
    }

    /**
     * Returns if has a behavior superclass
     * @type {boolean}
     */
    get hasSuperClass() {
        return this.superclass && this.superclass !== ScopeTypeItem.RootClass;
    }

    /**
     * Determines if the current type can be cast to `type` is castable. This
     * checks for a valid OO cast which may or may not be a valid expression
     * cast. Use {@link TransformationContext#contextuallyCastable} if
     * applicable.
     *
     * @param {ScopeTypeItem} type - If the current type can be cast to this
     *                             type.
     * @return {number} can be treated as a boolean. 0 if cannot be cast, else,
     *                  this is the distance of the cast (lower = more specific)
     */
    castableTo(type) {
        this.resolve();
        type = type.resolved();

        // Check if cast to the same type
        if (type === this) return 1;

        // Check if casting to new type
        let canCastSuperclass = this.superclass?.resolved().castableTo(type);
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
     * Returns if the current type can be **subclassed**.
     * @return {boolean}
     */
    canSubclass() {
        // By default is true for classes. For interfaces different thing must
        // be done.
        return !this.isInterface;
    }

    /**
     * Returns the type in a context. Can be used to resolve generic.
     * @param {TypeContext} typeContext
     * @return {ScopeTypeItem} may return a different class FYI.
     */
    contextualType(typeContext) {
        return this;
    }

    /**
     * Obtains the common type between current type and other. Common type is
     * always Object so in that case this still returns null.
     *
     * Note that `A.commonType(B)` is same as `B.commonType(A)`.
     *
     * If we treat the inheritance hierarchy like a polytree then given two nodes
     * basically find where they are equal. All types inherit object except
     * interfaces so we use a left-to-right approach.
     *
     * This ONLY checks classes because implicit interface casts can be
     * problematic.
     *
     * @param {ScopeTypeItem} otherType
     * @return {?ScopeTypeItem}
     */
    commonType(otherType) {
        // If they are same
        if (otherType === this) {
            return this;
        }

        const selfStack = this.superclassStack;
        const otherStack = otherType.superclassStack;

        let furthestCommonType = null;
        for (let i = 0; i < selfStack.length && i < otherStack.length; i++) {
            if (selfStack[i] === otherStack[i]) {
                furthestCommonType = selfStack[i];
            } else {
                break;
            }
        }

        return furthestCommonType;
    }

    /**
     * Returns TypeContext for just this specialization.
     * @return {TypeContext}
     */
    getTypeContext() {
        if (this.hasSuperClass) {
            return this.superclass.getTypeContext();
        } else {
            return TypeContext.empty();
        }
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

    /**
     * Returns human-readable description of type.
     * @type {string}
     * @override
     */
    get typeDescription() { return 'Class'; }

    /** @return {string} */
    toString() {
        return `${this.rootId}`
    }
}
