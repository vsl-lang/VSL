import ScopeInitItem from '../vsl/scope/items/scopeInitItem';
import ScopeFuncItem from '../vsl/scope/items/scopeFuncItem';
import ScopeTypeItem from '../vsl/scope/items/scopeTypeItem';
import ScopeTypeAliasItem from '../vsl/scope/items/scopeTypeAliasItem';
import ScopeGenericItem from '../vsl/scope/items/scopeGenericItem';

import ItemType from './ItemType';
import DocError from './DocError';

/**
 * Documentation generator for a given item
 *
 *     Type=
 *         ref: "name",
 *         module: "module"
 */
export default class ItemDocGen {
    /**
     * Generates a documentation item
     * @param {DocGen} generator - Managing generator
     */
    constructor(generator) {
        /** @type {DocGen} */
        this.generator = generator;
    }

    generate(item) {
        if (item.isScopeRestricted) return;
        switch (item.constructor) {
            case ScopeFuncItem: return this.generator.getGeneratorFor(ItemType.Function).generate(item);
            case ScopeTypeItem: return this.generator.getGeneratorFor(ItemType.Class).generate(item);
            case ScopeInitItem: return this.generator.getGeneratorFor(ItemType.Initializer).generate(item);
            case ScopeTypeAliasItem: return this.generator.getGeneratorFor(ItemType.TypeAlias).generate(item)
            case ScopeGenericItem: return this.generator.getGeneratorFor(ItemType.GenericClass).generate(item)
            default:
                const name = item?.constructor?.name || item;
                throw new DocError(
                    `Could not identify documentation generator for item ${name}.`,
                    item?.source
                )
        }
    }
}
