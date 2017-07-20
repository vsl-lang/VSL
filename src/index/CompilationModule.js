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
     * @param {string} name - name of this module
     * @param {HookType} hookType - a compilation hook
     * @param {CompilationIndex} index - The compilationIndex to wrap.
     */
    constructor(name, hookType, index) {
        /**
         * Name of the compilation module
         * @type {string}
         */
        this.name = name;
        
        /**
         * Type of the hook (Lazy, or Storng)
         * @type {HookType}
         */
        this.hookType = type;
        
        /**
         * CompilationIndex for recursive compilation.
         * @type {CompilationIndex}
         */
        this.index = index;
    }
}
