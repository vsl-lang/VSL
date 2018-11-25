/**
 * Specifies the type of a constraint
 * @typedef {Object} ConstraintType
 * @property {number} RequestedTypeResolutionConstraint - A single type candidate of
 *                                                      possible resolutions
 * @property {number} TransformationContext - {@link TransformationContext}
 *                                          object.
 * @property {number} BoundedFunctionContext - Specifies that an identifier is
 *                                           a function's name. This negotiates
 *                                           to the amount of args provided.
 * @property {number} VoidableContext - Boolean. Specifies a function can have
 *                                   return type of `Void`.
 * @property {Scope} TypeScope - The subscope of the lookup location used. Will
 *                             refer to subscope in member situations.
 * @property {boolean} SimplifyToPrecType - If the parent CANNOT take multiple
 *                                        types so ONLY ONE should be returned.
 * @property {boolean} RequireType - Specifies that at LEAST one type must be
 *                                 returned.
 * @property {GenericInstance} TypeContext - A propogated `TypeContext` class if
 *                                         applicable.
 */
const ConstraintType = {
    RequestedTypeResolutionConstraint: 1 << 1,
    TransformationContext: 1 << 2,
    BoundedFunctionContext: 1 << 3,
    VoidableContext: 1 << 4,
    TypeScope: 1 << 6,
    SimplifyToPrecType: 1 << 7,
    RequireType: 1 << 5,
    TypeContext: 1 << 8,
};

export default ConstraintType;
