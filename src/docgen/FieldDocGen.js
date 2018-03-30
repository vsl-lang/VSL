import ItemDocGen from './ItemDocGen';
import genType from './helpers/genType';

/**
 * Creates documentation for a field
 */
export default class FieldDocGen extends ItemDocGen {
    generate(item) {
        return {
            ty: 'field',
            name: item.rootId,
            fieldType: genType(item.type)
        }
    }
}
