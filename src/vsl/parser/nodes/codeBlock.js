import Node from './node';
import Scope from '../../scope/scope';

/**
 * Contains a series of statements.
 *
 * This is used by the scope generator to determine where a new scope starts. If
 * this does not fit your needs but you need a scope, subclass this and call the
 * `statements:` field with null
 */
export default class CodeBlock extends Node {
    
    /**
     * Creates a scoped series of expressions
     *
     * @param {Node[]} statements - the statements
     * @param {Object} position - a position from nearley
     */
    constructor (statements: any[], position: Object) {
        super(position);
        
        /** @type {Expression[]} */
        this.statements = statements;
        
        /**
         * This is a hashmap describing the child scope and it's variables. It
         * contains both variable information. This is primarially to be used by
         * `ScopeTransformer`, and all information in custom transformations
         * should be accessable through an `ASTTool`
         *
         * @type {Scope}
         */
        this.scope = new Scope();
        
        /**
         * True if this is the top-level main scope of a file. Note: a global or
         * shared scope for this is false.
         * @type {boolean}
         */
        this.rootScope = false;
        
        /**
         * Automatically populated by import visitors. This is the list of
         * lazyHooks this will have
         * @type {ImportStatement[]}
         */
        this.lazyHooks = [];
    }
    
    /** @override */
    get children() {
        return ['statements'];
    }
    
    /** @override */
    toString() {
        return `{\n${this.statements.map(i => "    " + i.toString().split("\n").join("\n    ")).join("\n")}\n}`
    }
}
