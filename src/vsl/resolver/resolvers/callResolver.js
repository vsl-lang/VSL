import ConstraintType from '../constraintType';
import TypeConstraint from '../typeConstraint';
import TypeCandidate from '../typeCandidate';
import TypeResolver from '../typeResolver';

import GenericTypeReferenceItem from '../../scope/items/GenericTypeReferenceItem';
import ScopeFuncItem from '../../scope/items/scopeFuncItem';
import ScopeTypeItem from '../../scope/items/scopeTypeItem';

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
                case ConstraintType.BoundedFunctionContext: return true;

                // The child cannot be voidable
                case ConstraintType.VoidableContext: return false;

                // Propogate negotation as this only handles the one
                default: return negotiate(type);
            }
        };

        // Get requested type that the function should return
        const expectedReturnType = negotiate(ConstraintType.RequestedTypeResolutionConstraint)

        // Check if voidable here
        const voidableContext = negotiate(ConstraintType.VoidableContext);

        // Negotiate the requested type for this identifier.
        // Generate the arg object and we'll ref that for lookup
        // The types of these children are not yet known so we'll need to narrow
        // them down as best as we can and use those as the candidates
        let headValues = this.getChild(this.node.head)
            .resolve(headResolver) // Resolve expression
            .map(item => item.resolved()); // Resolve types


        ////////////////////////////////////////////////////////////////////////
        ////////////////////////////////////////////////////////////////////////
        //                          GET CANDIDATES                            //
        ////////////////////////////////////////////////////////////////////////
        ////////////////////////////////////////////////////////////////////////

        const scope = this.node.parentScope.scope;

        // Basic filter which removed candidates which aren't either funcs
        // or have less arguments than called with,
        let items = [];

        for (let i = 0; i < headValues.length; i++) {
            // Support initializers, if we call type we'll interpret it as
            // an init call.
            if (headValues[i] instanceof ScopeTypeItem) {
                items.push(...headValues[i].subscope.getAll('init'));
            } else {
                items.push(headValues[i]);
            }
        }

        // Filter the valid function types
        let candidates = items.filter(item => {
            return item instanceof ScopeFuncItem && item.args.length === argc;
        });

        // If they are 0 candidates that means there is no function which
        // actually has the name
        if (candidates.length === 0) {
            this.emit(
                `Use of undeclared function \`${this.node.head.toString()}\``,
                e.UNDECLARED_FUNCTION
            )
        }

        // If there is one candidate we'll set this reference. Otherwise
        // we'll have to redo it. If this is `null` in backend an error
        // should be thrown.
        if (candidates.length === 1) {
            this.reference = candidates[0];
        }


        ////////////////////////////////////////////////////////////////////////
        ////////////////////////////////////////////////////////////////////////
        //                          RESOLVE ARGS                              //
        ////////////////////////////////////////////////////////////////////////
        ////////////////////////////////////////////////////////////////////////

        let orderedArgCandidates = [];
        // Resolve all arguments
        for (let i = 0; i < argc; i++) {
            orderedArgCandidates.push(
                this.getChild(args[i].value).resolve((type) => {
                    switch (type) {
                        // The child cannot be voidable
                        case ConstraintType.VoidableContext: return false;

                        case ConstraintType.RequestedTypeResolutionConstraint: return null;

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

            // Additionally check VoidableContext. If this context is not
            // voidable and there is a void return then this is not valid.
            if (!voidableContext && !candidate.returnType) {
                continue;
            }

            // Lets first do checks and see if return type works
            if (expectedReturnType) {
                if (!candidate.returnType) {
                    // If we expect return and there is none then it is not a valid candidate
                    continue;
                } else if (!candidate.returnType.castableTo(expectedReturnType.candidate)) {
                    // If the return type is not (up)castable to the expected return type,
                    // then this is not a valid candidate
                    continue;
                }
            }

            // If same arg length & function name we'll have to go through each
            // arg and check for compatibility.
            for (let j = 0; j < argc; j++) {
                let arg = args[j],
                    argName = arg.name?.value,
                    argTypes = orderedArgCandidates[j],
                    targetArgName = candidate.args[j].name,
                    targetArgType = candidate.args[j].type;

                // If there is an arg name, but they don't match then continue.
                if (argName && argName !== targetArgName) continue main;

                // Will store the candidate arg type for the given arg.
                let workingArgType = null;

                // Go through each type and check which conflicts
                // NOTE: ambiguous types should NEVER be related in the
                // candidate list.
                for (let k = 0; k < argTypes.length; k++) {
                    if (argTypes[k].candidate.castableTo(targetArgType)) {
                        workingArgType = argTypes[k];
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
                        `Ambiguous use of function. Could not break tie between:\n${
                            [maxCandidate, workingCandidates[i]]
                                .map(candidate => `    • ${candidate} (score: ${maxCandidateScore})`)
                                .join('\n')
                        }\n`,
                        e.AMBIGUOUS_CALL
                    );
                } else {
                    maxCandidate = workingCandidates[i];
                }
            }
        }

        if (maxCandidate === null) {
            this.emit(
                `Call to function does not match any valid candidates. Valid ` +
                `candidates are:\n` +
                candidates.map(
                    candidate => `    • ${candidate}`
                ).join("\n") +
                `\nInstead, deducted to \`func (${
                    orderedArgCandidates.map(
                        (type, i) => {
                            let argName = args[i].name?.value || "*";
                            return `${argName}: ${type.join(" | ")}`
                        }
                    ).join(", ")
                }) -> ${expectedReturnType || "*"}\``,
                e.INVALID_FUNCTION_CALL
            );
        } else {
            // Re-resolve subtypes to ensure unambiguous refs.
            for (let i = 0; i < argc; i++) {
                this.getChild(args[i].value).resolve((type) => {
                    switch (type) {
                        // The child cannot be voidable
                        case ConstraintType.VoidableContext: return false;

                        case ConstraintType.RequestedTypeResolutionConstraint:
                            return new TypeCandidate(maxCandidate.args[i].type);

                        default: return negotiate(type);
                    }
                });
            }

            // We must make sure we can access it
            if (!this.node.parentScope.scope.canAccess(maxCandidate)) {
                this.emit(
                    `Cannot use private function from this context.`,
                    e.INVALID_ACCESS
                );
            }

            // If we have succesfully found the one correct candidate...
            this.node.headRef = maxCandidate;
            return [new TypeCandidate(maxCandidate.returnType)];
        }
    }
}
