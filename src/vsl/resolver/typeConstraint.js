/**
 * Specifies a type constraint.
 */
export default class TypeConstraint {
    /**
     * @param {bool} requested - `true` if requested, `false` if desired.
     * @param {ConstraintType} type - the type of the constraint 
     * @param {?Type} type - The type the constraint represents. Null if
     *     negotation offer.
     */
    constructor(requested: bool, type: ConstraintType, value: ?Type = null) {
        this.requested = requested;
        this.type = type;
        this.value = value;
    }
}
