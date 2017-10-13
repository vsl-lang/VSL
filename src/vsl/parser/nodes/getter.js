import Node from './node';

export default class Getter extends Node {
    
    /**
     * Creates a wrapper for getters
     * 
     * @param {boolean[]} modifiers The modifiers of the getter
     * @param {AssignmentStatement} name The name of the getter
     * @param {CodeBlock} body The body of the getter
     */
    constructor (modifiers: boolean[], name: AssignmentStatement, body: CodeBlock, position: Object) {
        super(position);
        
        /** @type {boolean[]} */
        this.modifiers = modifiers;
        
        /** @type {AssignmentStatement} */
        this.name = name;
        
        /** @type {CodeBlock} */
        this.body = body;
    }
    
    /** @override */
    get children() {
        return null;
    }
    
    /** @override */
    toString() {
        return this.modifiers.join(' ') + this.name.toString() + this.body.toString();
    }
}