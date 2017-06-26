/**
 * Fixes a thing as referenced from a FIX-IT
 */
export default class FixIt {
    /**
     * Creates a FIX-IT which applies to a specific node, we need the exact
     * source string the parser has received because very bad things will happen
     * if the positions are off
     *
     * @param {string}   source - Source code
     * @param {Node}     node   - Target node which is being 'fixed'
     * @param {Promise}  input  - Promise which takes an argument `name` which
     *                          is the name of the input value we need to get.
     */
    constructor(source, node, input) {
        /** @private */
        this.source = source;
        
        /** @private */
        this.node = node;
        
        /** @private */
        this.position = node.position;
        
        /** @private */
        this.input = input;
    }
    
    /**
     * Async function which applies a specific FIX-IT.
     * @param  {Object}  fixit Fix-It object
     * @return {Promise}       A promise which is called when finished. Resolves
     *                           with new source. You should reparse as not sure
     *                           if AST is nonsense or makes sense
     */
    async applyFixit(fixit) {
        let { d: name, f: callback, a: args = [] } = fixit;
        
        let inputs = [];
        for (let i = 0; i < args.length; i++) {
            inputs.push(await this.input(args[i]));
        }
        
        let fixitManager = new FixItManager(this.source, this.node);
        fixit(fixitManager, inputs);
        return fixitManager.source;
    }
}
