import Chain from '@/LLIR/ExecutionGraph/Node/Nodes/Chain';

/**
 * Represents a primitive LLVM command (e.g. `add [i32 foo, bar]`).
 * @extends DirectMap
 */
export default class LLVMChainMain extends Chain {
    static uidname = "vsl::llvmchainmain";

    constructor() {
        super();
    }

    /** @override */
    init() {
        super.init();
        this.defaultChain = [];
    }

    /**
     * Adds a default graph which is compiled before the others.
     * @param {AtomicGraph} atomicGraph - Atomic graph to add to the default
     *                                  execution chain.
     */
    pushEventDefaultGraph(atomicGraph) {
        this.defaultChain.push(atomicGraph);
        atomicGraph.setSupergraph(this.globalConstraint)
    }

    /** @override */
    *atomicGraphs() {
        yield* this.defaultChain;
        yield* super.atomicGraphs();
    }
}
