/**
 * This has two uses:
 *  - Track which module is which
 *  - Store miscellaneous data about a CompilationGroup/module
 *
 * You local {@link CompilationGroup} should provide you one of these through
 * a group's {@link CompilationGroup~metadata}. That said, it may not be filled
 * and you'd likely need to supply data.
 */
export default class GroupMetadata {
    /**
     * You can pass no args and configure later if you'd like;
     *
     * @param {?Object} [o={}] options
     * @param {?string} [o.name=null] - No module name.
     * @param {?string} [o.cacheDirectory=null] - Cache directory
     */
    constructor({ name = null, cacheDirectory = null } = {}) {
        /**
         * The name of this group. Generally module name
         * @type {?string}
         * @readonly
         */
        this.name = name;

        /**
         * Set this to specify the name of the cache directory.
         * @type {?string}
         */
        this.cacheDirectory = cacheDirectory;
    }
}
