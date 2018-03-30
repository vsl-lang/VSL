import ItemDocGen from './ItemDocGen';
import genType from './helpers/genType';

/**
 * Creates documentation for a type alias
 */
export default class TypeAliasDocGen extends ItemDocGen {
    generate(item) {
        return {
            name: item.rootId,
            referencingType: genType(item.resolved())
        }
    }
}
