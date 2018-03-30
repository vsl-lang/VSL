import ItemDocGen from './ItemDocGen';
import genType from './helpers/genType';
import parseComment from './helpers/parseComment';

/**
 * Generates documentation for functions.
 *
 *      Function=
 *          ty: 'function'
 *          name: "name"
 *          params: [FunctionParam]
 *          returns: Type
 *
 *      FunctionParam=
 *          name: "name"
 *          argType: Type
 */
export default class FuncDocGen extends ItemDocGen {
    generate(item) {
        const { content } = parseComment(item.source.precedingComments);

        return {
            ty: 'function',
            overview: content,
            name: item.rootId,
            params: item.args.map(
                arg => ({
                    name: arg.name,
                    argType: genType(arg.type)
                })
            ),
            returns: item.returnType ? genType(item.returnType) : null
        }
    }
}
