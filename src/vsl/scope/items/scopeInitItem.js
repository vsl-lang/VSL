import ScopeFuncItem from './scopeFuncItem';
import ScopeForm from '../scopeForm';

/**
 * Describes an initializer.
 */
export default class ScopeInitItem extends ScopeFuncItem {

    /**
     * Creates a spot for a function in a scope. Use this when you need to
     * handle overloading etc. For lambdas you probably want to use a normal
     *
     * @param {ScopeForm} form - The form or type of the scope item.
     * @param {string} rootId - Do not override. Should be 'init' in ALL cases.
     * @param {Object} data - Information about the class
     */
    constructor(form, rootId, data) {
        super(form, rootId, data);

        /** @type {ScopeTypeItem} */
        this.initializingType;

        /** @type {boolean} */
        this.isDefaultInit;
    }

    /**
     * Called with all args to {@link ScopeTypeItem} and also these.
     * @param {ScopeTypeItem} initializingType - The type being init'd might be
     *                                         same as `self.owner.owner`
     * @param {Boolean} isDefaultInit - If is a VSL-sourced implicit init.
     * @param {Boolean} implicitSuperclassCall - If superclass init() is implicit
     *                                         called.
     * @param {Object} opts other opts
     */
    init({ initializingType, isDefaultInit, implicitSuperclassCall, ...opts }) {
        // We can set the name to `init` because that's a keyword anyway. You
        // can't have a function named init.
        super.init({ ...opts });
        this.initializingType = initializingType;
        this.isDefaultInit = isDefaultInit;
        this.implicitSuperclassCall = implicitSuperclassCall;
    }

    /** @override */
    clone(opts) {
        super.clone({
            initializingType: this.initializingType,
            isDefaultInit: this.isDefaultInit,
            implicitSuperclassCall: this.implicitSuperclassCall,
            ...opts
        });
    }

    /** @override */
    toString() {
        return `${this.initializingType.selfType}(${this.args.join(", ")})`;
    }

    /**
     * Returns human-readable description of type.
     * @type {string}
     * @override
     */
    get typeDescription() { return 'Initializer'; }

    /**
     * Returns unique name for scope item
     * @type {string}
     */
    get uniqueName() {
        return `i${super.uniqueName}`
    }
}
