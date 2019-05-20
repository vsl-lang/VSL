import DocGenWatcher from '../DocGenWatcher';
import ScopeTypeItem from '../../vsl/scope/items/scopeTypeItem';
import getMethodsFor from '../helpers/getMethodsFor';
import getMethodMetadata from '../helpers/getMethodMetadata';

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
        const description = scopeItem.source.precedingComments;

        // Get methods
        const { inits, methods, staticMethods, subscripts } = getMethodsFor(scopeItem);

        return {
            path: 'template/Class.pug',
            opts: {
                name: scopeItem.rootId,
                description: description,

                inits: inits.map(getMethodMetadata),
                methods: methods.map(getMethodMetadata),
                staticMethods: staticMethods.map(getMethodMetadata),
                subscripts: subscripts.map(getMethodMetadata),
            }
        }
    }

}
