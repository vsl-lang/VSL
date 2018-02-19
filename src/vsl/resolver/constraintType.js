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
 * @property {ScopeFuncItem} BindingContext - A query for the appropriate
 *                                          scopeItem, merely including the
 *                                          params.
 * @property {number} VoidablContext - Boolean. Specifies a function can have
 *                                   return type of `Void`.
 */
const ConstraintType = {
    RequestedTypeResolutionConstraint: 1 << 1,
    TransformationContext: 1 << 2,
    BoundedFunctionContext: 1 << 3,
    VoidableContext: 1 << 4,
    BindingContext: 1 << 5
};

export default ConstraintType;
