import ConstraintType from '../constraintType';
import TypeConstraint from '../typeConstraint';
import TypeResolver from '../typeResolver';

import ScopeFuncItem from '../../scope/items/scopeFuncItem';

import e from '../../errors';

/**
 * Resolves and chooses the correct function to call of the head. This is  NOT
 * an atomic resolution
 */
export default class CallResolver extends TypeResolver {

    /**
     * @param {Node} node - The node to resolve.
     * @param {function(from: Node): TypeResolver} getChild - Takes a node and
     *     returns the resolver to execute, it is reccomended to just use a
     *     `switch` statement with `from.constructor` and then use that. It is
     *     fine to throw if the node is unhandled.
     */
    constructor(
        node: Node,
        getChild: (Node) => TypeResolver
    ) {
        super(node, getChild);
    }

    /**
     * Resolves types for a given node.
     *
     * @param {function(offer: ConstraintType): ?TypeConstraint} negotiate - The
     *     function which will handle or reject all negotiation requests. Use
     *     `{ nil }` to reject all offers (bad idea though).
     */
    resolve(negotiate: (ConstraintType) => ?TypeConstraint): void {
        const args = this.node.arguments;
        const argc = args.length;

        // This will resolve the head of the function. e.g. in `a.b(c)` this
        // negotiates the resolution of `a.b`
        const headResolver = (type) => {
            switch (type) {
                // This basically says we want a function in return
                // This will return ALL of the function with the rootId
                // So we'll filter candidates here.
                case ConstraintType.BoundedFunctionContext: return argc;

                // Propogate negotation as this only handles the one
                default: return negotiate(type);
            }
        };

        // Negotiate the requested type for this identifier.
        // Generate the arg object and we'll ref that for lookup
        // The types of these children are not yet known so we'll need to narrow
        // them down as best as we can and use those as the candidates
        let candidates = this.getChild(this.node.head).resolve(headResolver);

        let orderedArgCandidates = [];
        // Resolve all arguments
        for (let i = 0; i < argc; i++) {
            orderedArgCandidates.push(
                this.getChild(args[i].value).resolve((type) => {
                    switch (type) {
                        // Right no they are no parent constraints. We'll resolve
                        // that later.
                        default: return negotiate(type);
                    }
                })
            );
        }

        // List of working candidates
        let workingCandidates = [];

        // This is a list of candidate => amount of types a prec type is used.
        let candidatePrecTypeMap = [];

        // This works by:
        //  - Go through each candidates

        // This array is the types which we should set as the
        // RequestedTypeResolutionConstraints
        main: for (let i = 0; i < candidates.length; i++) {
            const candidate = candidates[i];

            // Amount of times we chose a prec type over normal.
            let precedencePreferalCount = 0;

            // If same arg length & function name we'll have to go through each
            // arg and check for compatibility.
            for (let i = 0; i < argc; i++) {
                let arg = args[i],
                    argName = arg.name,
                    argTypes = orderedArgCandidates[i],
                    targetArgName = candidate.args[i].name,
                    targetArgType = candidate.args[i].type;

                // If there is an arg name, but they don't match then continue.
                if (argName && argName !== targetArgName) continue main;

                // Will store the candidate arg type for the given arg.
                let workingArgType = null;

                // Go through each type and check which conflicts
                // NOTE: ambiguous types should NEVER be related in the
                // candidate list.
                for (let j = 0; j < argTypes.length; j++) {
                    if (argTypes[j].candidate.castableTo(targetArgType)) {
                        workingArgType = argTypes[j];
                        break;
                    }
                }

                // If we couldn't find a matching type, then this overload
                // doesn't work.
                if (workingArgType === null) continue main;

                // If it was a prec type we will specify that we are using a
                // prec type in this case.
                if (workingArgType.precType === true) {
                    precedencePreferalCount += 1;
                }
            }


            // If we are here then the two functions match.
            workingCandidates.push(candidate);
            candidatePrecTypeMap.push(precedencePreferalCount);
        }

        let maxCandidateScore = Math.max(...candidatePrecTypeMap);
        let maxCandidate = null;
        for (let i = 0; i < workingCandidates.length; i++) {
            if (candidatePrecTypeMap[i] === maxCandidateScore) {
                if (maxCandidate !== null) {
                    this.emit(
                        `Ambiguous use of function.`,
                        e.AMBIGUOUS_REFERENCE
                    )
                } else {
                    maxCandidate = workingCandidates[i];
                }
            }
        }

        if (maxCandidate === null) {
            this.emit(
                `Call to function does not match any valid candidates.`,
                e.UNKNOWN_REF
            );
        } else {
            // If we have succesfully found the one correct candidate...
            this.node.headRef = maxCandidate;
            return [maxCandidate];
        }
    }
}
