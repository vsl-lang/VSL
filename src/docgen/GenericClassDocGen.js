import ItemDocGen from './ItemDocGen';
import genType from './helpers/genType';

/**
 * Creates documentation for a field
 */
export default class GenericClassDocGen extends ItemDocGen {
    generate(item) {
        return {
            ty: 'generic_class'
        }
    }
}
