import HTMLGenerator from './HTMLGenerator';

/**
 * Generates a HTML typealias
 */
export default class HTMLTypealiasGenerator extends HTMLGenerator {
    /** @override */
    async generate(item) {
        const typeName = item.name;

        await this.generator.getHTMLFor(`i/${typeName}.html`, 'typealias.pug')({
            item: item,
            target: item.referencingType
        });
    }
}
