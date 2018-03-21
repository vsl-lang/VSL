import ScopeTypeItem from '../../../scope/items/scopeTypeItem';

/**
 * Determines if a scope item is an instance something.
 * @param {ScopeItem} scopeItem
 * @return {boolean}
 */
export default function isInstanceCtx(scopeItem) {
    const owningScope = scopeItem.owner;
    return owningScope.owner instanceof ScopeTypeItem && !owningScope.isStaticContext;
}
