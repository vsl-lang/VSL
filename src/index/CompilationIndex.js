import CompilationModule, { HookType } from './CompilationModule';
import CompilationHook from './CompilationHook';

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
     *                                      modules. MAKE SURE you have already
     *                                      compiled the other
     *                                      CompilationIndexes.
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
     * @param  {CompilationStream} stream A compilation stream which will be
     *                                    where all compilation data will be
     *                                    piped.
     * @return {Promise} Resolves to a {@link CompilationResult} or null
     */
    async compile(stream) {
        for (let module of this.modules) {
            let items = [];
            
            // Propogate the new items from the scope of the module
            new PropogateModifierTraverser(
                {
                    protected: p.Hide,
                    private: p.Hide,
                    public: p.Propogate,
                    none: p.Hide
                },
                (scopeItem) => items.push(scoeItem)
            ).queue(module.index.root.globalScope);
            
            // Create compilation hook for the module
            let hook = new CompilationHook(
                module.name,
                module.index.root.metadata,
                items
            );
            
            // Check hook type and hook the generated hook
            if (module.hookType === HookType.Strong) {
                this.root.strongHook(hook);
            } else {
                this.root.lazyHook(hook);
            }
        }
        
        // Now we can compile the group
        return await this.root.compile(stream);
    }
}
