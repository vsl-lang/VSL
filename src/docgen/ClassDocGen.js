import ItemDocGen from './ItemDocGen';
import ItemType from './ItemType';

import parseComment from './helpers/parseComment';

/**
 * Generates documentation for a class.
 */
export default class ClassDocGen extends ItemDocGen {
    generate(item) {
        const initializers = item.subscope.getAll('init');
        const fields = item.subscope.aliases;

        const initializerGenerator = this.generator.getGeneratorFor(ItemType.Initializer);
        const fieldGenerator = this.generator.getGeneratorFor(ItemType.Field);

        const { content } = parseComment(item.source.precedingComments);

        return {
            ty: 'class',
            overview: content,
            name: item.rootId,
            initializers: initializers.map(initializerGenerator.generate),
            fields: fields.map(fieldGenerator.generate)
        }
    }
}
