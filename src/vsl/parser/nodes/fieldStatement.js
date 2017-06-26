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
     * @param {string[]} modifiers Any kind of modifier for the field
     * @param {AssignmentType} type The assignment type
     * @param {TypedIdentifier} identifier The variable's identifier & type
     * @param {Expression} value The variable's inital value
     * @param {Object} position a position from nearley
     */
    constructor(
        modifiers: string[],
        type: AssignmentType,
        identifier: TypedIdentifier,
        value: Expression,
        position: Object
    ) {
        super(type, identifier, value, position);

        /** @type {string[]} */
        this.modifiers = modifiers;
    }

    /** @override */
    get children() {
        return ['modifiers'].concat(super.children);
    }

    /** @override */
    toString() {
        return `${this.modifiers.join(' ')} ${super.toString()}`;
    }
}
