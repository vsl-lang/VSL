import AssignmentStatement from './assignmentStatement';

/**
 * Matches a field inside a class.
 *
 * It's really just an {@link AssignmentStatement} with some extra modifiers.
 */
export default class FieldStatement extends AssignmentStatement  {

    /**
     * Creates a FieldStatement.
     *
     * @param {string[]} access A list of access modifiers for the statement
     * @param {AssignmentType} type The assignment type
     * @param {TypedIdentifier} name The variable's identifier & type
     * @param {Expression} value The variable's inital value
     * @param {boolean} isLazy If the statement is lazy
     * @param {Object} position a position from nearley
     */
    constructor(access, type, name, value, isLazy, position) {
        super(access, type, name, value, isLazy, position);
    }
}
