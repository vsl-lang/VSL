/**
 * Context for an LLIR generation state.
 */
export default class LLIRContext {
    /**
     * Creates LLIRContext for an LLIR generator instance
     * @param {LLIR} generator
     * @param {Subgraph} subgraph - subgraph to put things in.
     * @param {AtomicGraph} graph - atomic graph to put things in
     */
    constructor(generator, subgraph, graph) {
        /** @type {LLIR} */
        this.generator = generator;
        
        /** @type {AtomicGraph} */
        this.graph = graph;
        
        /** @type {Subgraph} */
        this.subgraph = subgraph;
    }
    
    /** @type {ExecutionGraph} */
    get executionGraph() {
        return this.subgraph.getExecutionGraph();
    }
    
    /** @type {GraphBuilder} */
    get make() {
        return this.executionGraph.make;
    }
    
    /**
     * Creates a new LLIR context with a new atomic graph context.
     * @param  {AtomicGraph} atomicGraph New atomic graph.
     * @return {LLIRContext}             Forked context
     */
    forkWithGraph(atomicGraph) {
        return new LLIRContext(
            this.generator,
            this.subgraph,
            atomicGraph
        );
    }
}
