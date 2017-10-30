import Node from 'llir/LLIR/ExecutionGraph/Node/Node';

/**
 * Represents a primitive LLVM command (e.g. `add [i32 foo, bar]`).
 * @extends LLIRNode
 */
export default class LLVMPrimitive extends Node {
    static uidname = "vsl::llvmprimitive";
    
    /** @override */
    init() {
        this.command = null;
        this.args = [];
    }
    
    /**
     * Sets the node's primary command name.
     * @param {string} name - Command name to set
     * @return {boolean} `true` if set, `false` if not (already has name).
     */
    setCommand(name) {
        if (this.command !== null) return false;
        this.command = name;
        return true;
    }
    
    /**
     * Sets the type of the LLVMPrimitive
     * @type {[type]}
     */
    
    /**
     * Pushes an argument. These are comma-seperated e.g. if you pushed `foo`
     * and `bar` for command `baz` it would output: `foo bar, baz`. You may want
     * to consider also using {@link LLVMPrimitive#setType} or a subclass.
     *
     * @param {string} arg - arg to push.
     */
    addArg() {
        this.args.push(arg);
    }
}
