import t from '../parser/nodes';

/**
 * Resolves an expressions types like magic.
 */
export default class TypeResolver {
    /**
     * Creates a type offer with a negotation function.
     * 
     * @param {Node} node - The node to resolve.
     * @param {function(from: Node): TypeResolver} getChild - Takes a node and
     *     returns the resolver to execute, it is reccomended to just use a
     *     `switch` statement with `from.constructor` and then use that. It is
     *     fine to throw if the node is unhandled.
     */
    constructor(
        node: Node,
        getChild: (Node) => TypeResolver
    ) {
        this.node = node;
        this.getChild = getChild;
    }
    
    /**
     * Resolves types for a given node.
     * 
     * @param {function(offer: ConstraintType): ?TypeConstraint} negotiate - The
     *     function which will handle or reject all negotiation requests. Use
     *     `{ nil }` to reject all offers (bad idea though).
     * 
     * @abstract
     */
    resolve(negotiate: (ConstraintType) => ?TypeConstraint): void {
        throw new TypeError("resolve must be overriden");
    }
}