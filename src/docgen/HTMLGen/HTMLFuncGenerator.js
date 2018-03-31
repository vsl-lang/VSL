import HTMLGenerator from './HTMLGenerator';

/**
 * Generates HTML for functions.
 */
export default class HTMLFuncGenerator extends HTMLGenerator {
    /** @override */
    async generate(item) {
        const funcName = item.name;

        this.generator.getHTMLFor(`i/${funcName}.html`, 'func.pug')({
            item: item,
            overloads: item.overloads
        });
    }
}
