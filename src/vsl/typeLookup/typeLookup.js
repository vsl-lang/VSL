import TypeLookupError from './typeLookupError';

/**
 * @typedef {func(Node): TypeLookup} Lookup
 */

/**
 * Resolves types.
 */
export default class TypeLookup {
    /**
     * @param {Node} node - Root node of type expression.
     * @param {Lookup} lookup - Root resolver
     */
    constructor(node, lookup) {
        /** @type {Node} */
        this.node = node;
        
        /**
         * Function to return the next resolver.
         * @type {Lookup}
         */
        this.getChild = lookup;
    }
    
    /**
     * Resolves the next child
     * @param {Scope} scope - scope to resolve within
     */
    resolve(scope) {
        return this.getChild(this.node).resolve(scope);
    }
    
    /**
     * Emits error with message & ref
     * @param {string} message - Error message
     * @param {Node} [node=this.node] - node to error for
     * @param {ErrorRef} ref - error ref.
     */
    emit(message, node = this.node, ref) {
        throw new TypeLookupError(
            message,
            node,
            ref
        )
    }
    
}
