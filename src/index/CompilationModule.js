/**
 * Type of hooking to hook object too.
 * @type {Object}
 */
export const HookType = {
    Lazy: 1,
    Strong: 2
};

/**
 * Encapsulates a CompilationIndex and provides an interface that can go into
 * {@link CompilationGroup} which provides information about. Don't create one
 * of these for your main CompilationIndex, only modules. This is used only by
 * {@link CompilationIndex} strictly, and exists for convenience.
 */
export default class CompilationModule {
    /**
     * Creates CompilationModule over a {@link CompilationIndex}. Assumes
     * already setup.
     *
     * @param {HookType} hookType - a compilation hook
     * @param {CompilationHook} hook - Compilation hook, optimally the metadata
     *                               from `index.root.metadata`.
     * @param {CompilationIndex} index - The compilationIndex to wrap.
     */
    constructor(hookType, hook, index) {
        /**
         * Type of the hook (Lazy, or Storng)
         * @type {HookType}
         */
        this.hookType = type;
        
        /**
         * Hook object containing hook information & metadata
         * @type {CompilationHook}
         */
        this.hook = hook;
        
        /**
         * CompilationIndex for recursive compilation.
         * @type {CompilationIndex}
         */
        this.index = index;
    }
}
