import ItemDocGen from './ItemDocGen';
import ItemType from './ItemType';

import genType from './helpers/genType';
import parseComment from './helpers/parseComment';

/**
 * Creates documentation for a field
 */
export default class GenericClassDocGen extends ItemDocGen {
    generate(item) {
        return {
            ...this.generator.getGeneratorFor(ItemType.Class).generate(item.usedWith(item.genericParents)),
            ty: 'class_generic',
            name: item.rootId,
            generics: [

            ]
        }
    }
}
