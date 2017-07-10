import Node from './node';
import CodeBlock from './codeBlock';

/**
 * Wraps a class
 * 
 */
export default class ClassProperty extends Node {
    
    /**
     * Constructs a generic function statement
     * 
     * @param {string[]} access - The access modifiers of the node
     * @param {Identifier[]} superclass - The superclasses to inherit or implement
     * @param {Node[]} statements - The class's body.
     * @param {Object} position - a position from nearley
     */
    constructor(
        modifiers: Modifier,
        assignment: AssignmentStatement,
        position: Object
    ) {
        super(position);
        
        /** @type {Modifier} */
        this.modifiers = modifiers;
        
        /** @type {AssignmentStatement} */
        this.assignment = assignment;
    }
    
    /** @override */
    toString() {
        return this.modifiers.toString() + ' ' + this.assignment.toString();
    }
    
    /** @override */
    get children() {
        return ['modifiers', 'assignment'];
    }
}