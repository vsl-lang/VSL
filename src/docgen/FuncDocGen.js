import ItemDocGen from './ItemDocGen';
import genType from './helpers/genType';
import parseComment from './helpers/parseComment';

/**
 * Generates documentation for functions.
 *
 *      Function=
 *          ty: 'function'
 *          name: "name"
 *          overloads: FunctionOverload
 *
 *      FunctionOverload=
 *          params: [FunctionParam]
 *          returns: Type
 *
 *      FunctionParam=
 *          name: "name"
 *          argType: Type
 */
export default class FuncDocGen extends ItemDocGen {
    generate(item) {
        const funcName = item.rootId;

        const { content } = parseComment(item.source.precedingComments);
        const func = {
            overview: content,
            params: item.args.map(
                arg => ({
                    name: arg.name,
                    argType: genType(arg.type)
                })
            ),
            returns: item.returnType ? genType(item.returnType) : null
        }

        // Check if function exists
        if (this.generator.funcSymbols.has(funcName)) {
            this.generator.funcSymbols.get(funcName).overloads.push(func);
            return null;
        } else {
            const funcItem = {
                ty: 'function',
                name: funcName,
                overloads: [func]
            };

            this.generator.funcSymbols.set(funcName, funcItem);
            return funcItem;
        }
    }
}
