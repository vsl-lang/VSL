import ScopeFuncItem from './ScopeFuncItem';
import ScopeForm from '../scopeForm';

/**
 * Describes a function declaration. Usually a top, nested, or class-level
 * declaration.
 */
export default class ScopeInitItem extends ScopeFuncItem {

    /**
     * Creates a spot for a function in a scope. Use this when you need to
     * handle overloading etc. For lambdas you probably want to use a normal
     *
     * @param {ScopeForm} form - The form or type of the scope item.
     * @param {string} rootId - Do not override. Must be 'init'
     * @param {Object} data - Information about the class
     */
    constructor(form, rootId, data) {
        super(form, 'init', data);
    }

    /** @override */
    init(opts) {
        // We can set the name to `init` because that's a keyword anyway. You
        // can't have a function named init.
        super.init({ ...opts });
    }

    /** @override */
    equal(ref: ScopeItem): boolean {
        // Check super condition
        // We will do extra disambiguation here
        if (!(ref instanceof ScopeInitItem)) return false;
        return super.equal(ref);
    }

    /** @override */
    toString() {
        return `init(${this.args.join(", ")})`;
    }
}
