import DocGenWatcher from '../DocGenWatcher';
import ScopeTypeItem from '../../vsl/scope/items/scopeTypeItem';
import parseComment from '../helpers/parseComment';

export default class ClassDocGenWatcher extends DocGenWatcher {

    /** @override */
    match(scopeItem) {
        return scopeItem instanceof ScopeTypeItem;
    }


    /**
     * Returns description (plural) of type the doc gen represents.
     * @type {String}
     * @override
     */
    get typeDescription() { return 'Classes'; }

    /** @override */
    urlFor(scopeItem) {
        return `class/${scopeItem.rootId}.html`;
    }

    /** @override */
    async generate([ scopeItem ], docGen) {
        const { content } = parseComment(scopeItem.source.precedingComments);

        return {
            path: 'template/Class.pug',
            opts: {
                name: scopeItem.rootId,
                description: content,
            }
        }
    }

}
