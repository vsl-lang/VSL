/**
 * Generates documentation for a given node
 */
export default class DocGenWatcher {

    /**
     * Checks if a provided scope item can be handled by this item.
     * @param {ScopeItem} scopeItem
     * @return {boolean}
     */
    match(scopeItem) {
        return false;
    }

    /**
     * Returns description (plural) of type the doc gen represents.
     * @type {String}
     */
    get typeDescription() { return 'ERROR'; }

    /**
     * Returns the URL for a given scope item. All items with same URL will be
     * grouped together.
     * @param {ScopeItem} scopeItem
     * @return {string} URL
     */
    urlFor(scopeItem) {
        return '/ERROR_URL';
    }

    /**
     * Handles the documentation generator watcher.
     * @param {ScopeItem[]} scopeItem
     * @param {DocGen} docGen
     * @return {Object}
     * @property {string} path - The path of the asset to build
     * @property {Object} opts - Options to pass to the object.
     */
    async generate(scopeItem, docGen) {
        return {
            path: '',
            opts: {}
        }
    }
}
