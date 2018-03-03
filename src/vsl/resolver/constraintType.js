/**
 * Specifies the type of a constraint
 * @typedef {Object} ConstraintType
 * @property {number} RequestedTypeResolutionConstraint - List of types that
 *                                                      are possible resolutions
 * @property {number} TransformationContext - {@link TransformationContext}
 *                                          object.
 * @property {number} BoundedFunctionContext - Specifies that an identifier is
 *                                           a function's name. This negotiates
 *                                           to the amount of args provided.
 * @property {number} VoidableContext - Boolean. Specifies a function can have
 *                                   return type of `Void`.
 * @property {Scope} TypeScope - The subscope of the lookup location used. Will
 *                             refer to subscope in member situations.
 */
const ConstraintType = {
    RequestedTypeResolutionConstraint: 1 << 1,
    TransformationContext: 1 << 2,
    BoundedFunctionContext: 1 << 3,
    VoidableContext: 1 << 4,
    TypeScope: 1 << 6
};

export default ConstraintType;
