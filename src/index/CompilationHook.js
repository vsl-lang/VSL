/**
 *
 */
export default class CompilationHook {
    /**
     * Creates a new CompilationHook but you shouldn't need to create any of the
     * other information as {@link CompilationGroup} will contain the metadata
     * and the hooks.
     *
     * @param {string} name - Unique identifier of the compilation hook. In a
     *                      `import <name>` statement, this should be the value
     *                      of `<name>`. If this is not a valid item which can
     *                      be inside such a statement, then it will be
     *                      processed but not be able to be imported.
     * @param {GroupMetadata} info - Information about the hook, generally
     *                             on a {@link CompilationGroup} object so
     *                             you can get this instance from there.
     * @param {ScopeItem[]} hooks - Array of {@link ScopeItem}s which will
     *                            be hooks onto
     */
    constructor(name, info, scope) {
        /**
         * @type {string}
         */
        this.name = name;
        
        /**
         * @readonly
         * @type {GroupMetadata}
         */
        this.info = info;
        
        /**
         * @type {ScopeItem[]}
         */
        this.scope = scope;
    }
}
