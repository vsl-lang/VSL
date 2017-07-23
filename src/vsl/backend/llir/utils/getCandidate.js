import BackendError from '../../BackendError';

/**
 * Returns the absolute type candidate from a type candidate list. If there is
 * ambiguity or there is no candidate this will throw.
 *
 * @param {ExpressionStatement} expression Expression node with typeCandidate
 *                                         list.
 * @param {?Node} [errorNode=expression] If provided, errors will say that the
 *                                 provided node is the one with incorrect type
 *                                 rather than the expression.
 * @throws {BackendError} any ambiguity or null-candidate errors.
 * @return {ScopeItem} Not the wrapping `TypeCandidate` object, rather the
 *                     actual scope item.
 */
export default function getCandidate(expression, errorNode = expression) {
    let candidates = expression.typeCandidates;
    
    if (candidates.length === 1) return candidates[0].candidate;
    if (candidates.length === 0) {
        throw new BackendError(
            `Node has no types (type candidates) which it could be.`,
            errorNode
        );
    }
    
    let result;
    for (let i = 0; i < candidates.length; i++) {
        let precType = candidates[i].precType;
        
        if (precType === null) {
            throw new BackendError(
                `Ambiguity in types. This can be multiple types`,
                errorNode
            )
        }
        
        if (precType === true) {
            result = candidates[i];
            break;
        }
    }
    
    if (!result) {
        throw new BackendError(
            `Ambiguious types with no type to take precedence`,
            errorNode
        );
    }
    
    return result.candidate;
}
