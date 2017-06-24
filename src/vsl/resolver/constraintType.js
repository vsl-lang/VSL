/**
 * Specifies the type of a constraint
 *
 * @enum {number}
 */
const ConstraintType = {
    RequestedTypeResolutionConstraint: 1 << 1,
    TransformationContext: 1 << 2,
    BoundedFunctionContext: 1 << 3,
    VoidableContext: 1 << 4
};

export default ConstraintType;
