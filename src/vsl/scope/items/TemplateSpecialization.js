import ScopeItem from '../scopeItem';
import ScopeForm from '../scopeForm';
import GenericTypeReferenceItem from './GenericTypeReferenceItem';

/**
 * Represents a template specialization placeholder. In an expression context,
 *  the .getExpressionValue() can be used
 */
export default class TemplateSpecialization extends ScopeItem {

    /**
     * Creates at type alias for a type. This will act like the aliased type. If
     * you pass a this to a serach you may get back the original.
     *
     * @param {ScopeForm} form - The form or type of the scope item.
     * @param {string} rootId - the root identifier in a scope.
     * @param {Object} data - Information about the class
     * @param {ScopeTypeAliasItem} data.item - The generic conformant parent. Type does not matter
     */
    constructor(form, rootId, data) {
        super(form, rootId, data);
    }

    /** @protected */
    init({ item, ...opts }) {
        super.init(opts);
        this._ref = item;
    }

    /** @return {string} */
    toString() {
        return `<>@${this.rootId}`;
    }

    /**
     * Gets the expression value of the generic parameter, used for type
     * deduction
     */
    getExpressionValue() {
        return this._ref.resolved();
    }
}
