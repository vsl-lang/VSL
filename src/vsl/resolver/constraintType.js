/**
 * Specifies the type of a constraint
 * 
 * @enum {number}
 */
const ConstraintType = {
    ContextParentConstraint: 1 << 0,
    RequestedTypeResolutionConstraint: 1 << 1,
    TransformationContext: 1 << 2,
    BoundedFunctionContext: 1 << 3
};

export default ConstraintType;
