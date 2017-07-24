/**
 * Specifies the type of a constraint
 *
 * @enum {number}
 */
const ConstraintType = {
    // List of types the _parent_ nodes can be
    RequestedTypeResolutionConstraint: 1 << 1,
    
    // TransformationContext object
    TransformationContext: 1 << 2,
    
    // Parent is a function call
    BoundedFunctionContext: 1 << 3,
    
    // Void functions are allowed
    VoidableContext: 1 << 4
};

export default ConstraintType;
