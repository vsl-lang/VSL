import ItemDocGen from './ItemDocGen';
import genType from './helpers/genType';

/**
 * Creates documentation for initializer
 */
export default class InitDocGen extends ItemDocGen {
    generate(item) {
        return {
            params: item.args.map(
                arg => ({
                    name: arg.name,
                    argType: genType(arg.type)
                })
            )
        }
    }
}
