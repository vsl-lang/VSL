import Node from './node';

/**
 * Matches an 'if' branching statement. Do note that else-ifs are actually the
 * `else` part of the `if` having another `if` statement in them.
 */
export default class IfStatement extends Node {
    /**
     * Creates an if-statement
     * 
     * @param {Expression} condition - The condition to check
     * @param {CodeBlock} trueBody - The body of the if statement
     * @param {?CodeBlock} falseBody - If non-null, the body of the false path.
     * @param {Object} position - A position from nearley
     */
    constructor(condition, trueBody, falseBody, position) {
        super(position);
        
        /** @type {Expression} */
        this.condition = condition;
        
        /** @type {trueBody} */
        this.trueBody = trueBody;
        
        /** @type {falseBody} */
        this.falseBody = falseBody;
    }
}