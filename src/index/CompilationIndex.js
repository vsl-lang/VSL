import CompilationModule, { HookType } from './CompilationModule';

/**
 * Manages an entire compilation. This manages multiple CompilationGroups
 * which represent modules or files compiled together. A primary
 * CompilationGroup is managed which inherits(?) public traits.
 *
 * This classes uses the {@link PropogateModifierTraverser} with the config:
 *
 *     {
 *         protected: p.Hide,
 *         private: p.Hide,
 *         public: p.Propogate
 *         none: p.Hide
 *     }
 *
 * This is a wrapper/convenience class, meaning you can use
 * {@link CompilationGroup} with all the features but you'll have to manually
 * resolve modules and extract information.
 */
export default class CompilationIndex {
    /**
     * Specifies the modules which will be compiled. Pass
     * {@link CompilationGroup}s which are _setup_ but not-compiled. This class
     * will automatically compile together using lazyHooking as applicable.
     *
     * @param {CompilationGroup}   root    The main compilation group which will
     *                                     be the one which is fully compiled.
     *                                     The rest will just have their scope
     *                                     (re)-traversed
     * @param {CompilationModule[]} modules CompilationIndexes for the other
     *                                      modules.
     */
    constructor(name, root, modules) {
        /**
         * The main compilation group which will be compiled.
         * @type {CompilationGroup}
         */
        this.root = root;
        
        /** @private */
        this.modules = modules;
    }
    
    /**
     * Compiles to a stream. Encapsulates {@link CompilationGroup~compile}, for
     * linkage, bitcode compilation this offers function for those.
     *
     * @return {Promise} Does not have any resolution value.
     */
    async compile() {
        // Wait for all the submodules to compile, they'll throw their own
        // errors if they want
        await Promise.all(
            this.modules.map(module => module.index.compile())
        );
        
        for (let module of modules) {
            if (module.type === HookType.Lazy)
                this.root.lazyHook(module.index.hook);
                
            if (module.type === HookType.Strong)
                this.root.strongHook(module.index.hook);
        }
        
        await this.root.compile();
    }
}
