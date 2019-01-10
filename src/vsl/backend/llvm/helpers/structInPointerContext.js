import ScopeTypeItem from '../../../scope/items/scopeTypeItem';
import ScopeEnumItem from '../../../scope/items/scopeEnumItem';
import ScopeTupleItem from '../../../scope/items/scopeTupleItem';

/**
 * Determines if a type is a struct in pointer context
 * @param {ScopeTypeItem} type
 * @return {boolean}
 */
export default function structInPointerContext(type) {
    return !(type.mockType || type instanceof ScopeTupleItem || type instanceof ScopeEnumItem);
}
