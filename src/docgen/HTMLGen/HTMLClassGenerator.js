import HTMLGenerator from './HTMLGenerator';

/**
 * Generates an HTML class
 */
export default class HTMLClassGenerator extends HTMLGenerator {
    /** @override */
    async generate(item) {
        const className = item.name;

        this.generator.getHTMLFor(`i/${className}.html`, 'class.pug')({
            item: item
        });
    }
}
