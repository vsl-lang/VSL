import ItemDocGen from './ItemDocGen';

import genType from './helpers/genType';
import parseComment from './helpers/parseComment';

/**
 * Creates documentation for a type alias
 */
export default class TypeAliasDocGen extends ItemDocGen {
    generate(item) {
        const { content } = parseComment(item.source.precedingComments);

        return {
            ty: 'typealias',
            overview: content,
            name: item.rootId,
            referencingType: genType(item.resolved())
        }
    }
}
