import ConstraintType from '../constraintType';
import TypeConstraint from '../typeConstraint';
import TypeCandidate from '../typeCandidate';
import TypeResolver from '../typeResolver';
import TypeContext from '../../scope/TypeContext';

import ScopeMetaClassItem from '../../scope/items/scopeMetaClassItem';
import ScopeGenericSpecialization from '../../scope/items/scopeGenericSpecialization';
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
        const functionName = this.node.head.toString();
        const args = this.node.arguments;
        const argc = args.length;

        // This will resolve the head of the function. e.g. in `a.b(c)` this
        // negotiates the resolution of `a.b`
        const headNegotiator = (type) => {
            switch (type) {
                // This basically says we want a function in return
                // This will return ALL of the function with the rootId
                // So we'll filter candidates here.
                case ConstraintType.BoundedFunctionContext: return true;

                // The child (function head) cannot be void
                case ConstraintType.VoidableContext: return false;

                // The child (function head) we'll allow multiple values
                case ConstraintType.SimplifyToPrecType: return false;

                // Propogate negotation as this only handles the one
                default: return negotiate(type);
            }
        };

        // Get requested type that the function should return
        const expectedReturnType = negotiate(ConstraintType.RequestedTypeResolutionConstraint)

        // Check if voidable here
        const voidableContext = negotiate(ConstraintType.VoidableContext);

        // If a definite deduction is expected
        const simplifyToPrecType = negotiate(ConstraintType.SimplifyToPrecType);

        // Negotiate the requested type for this identifier.
        // Generate the arg object and we'll ref that for lookup
        // The types of these children are not yet known so we'll need to narrow
        // them down as best as we can and use those as the candidates
        let headResolver = this.getChild(this.node.head);
        let headValues = headResolver
            .resolve(headNegotiator) // Resolve expression
            .map(item => item.candidate.resolved()); // Resolve types

        ////////////////////////////////////////////////////////////////////////
        ////////////////////////////////////////////////////////////////////////
        //                          GET CANDIDATES                            //
        ////////////////////////////////////////////////////////////////////////
        ////////////////////////////////////////////////////////////////////////

        const scope = this.node.parentScope.scope;

        // Basic filter which removed candidates which aren't either funcs
        // or have less arguments than called with,
        let items = [];

        // Error message to use if they are no functions with the name
        let errorMessage = `Use of undeclared function \`${functionName}\``;

        // Type context we'll use when resolving return and parameter types.
        let typeContext = headResolver.getNegotiatationProposal(ConstraintType.TypeContext) || TypeContext.empty();

        for (let i = 0; i < headValues.length; i++) {
            if (headValues[i] instanceof ScopeMetaClassItem) {
                // ===== CONSTRUCTORS =====
                // Support initializers, if we call type we'll interpret it as
                // an init call.

                const classToConstruct = headValues[i].referencingClass;
                items.push(...classToConstruct.subscope.getAll('init'));

                typeContext = typeContext.merge(classToConstruct.getTypeContext());

                errorMessage = `Class \`${functionName}\` has no intializers.`;
            } else if (headValues[i] instanceof ScopeFuncItem) {
                // ===== FUNCTIONS =====
                // These are regular ol' functions
                items.push(headValues[i]);
            } else {
                this.emit(
                    `Cannot call a non-function type`
                );
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
                errorMessage,
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
        //                      FIND VALID OVERLOADS                          //
        ////////////////////////////////////////////////////////////////////////
        ////////////////////////////////////////////////////////////////////////


        // List of working candidates
        let workingCandidates = [];

        // This array is the types which we should set as the
        // RequestedTypeResolutionConstraints
        main: for (let i = 0; i < candidates.length; i++) {
            const candidate = candidates[i];

            // Amount of times we chose a prec type over normal.
            // used to break ties when multiple candidates could work.
            let tiebreakerBonus = 0;


            ////////////////////////////////////////////////////////////////////////
            ////////////////////////////////////////////////////////////////////////
            //                        CHECK RETURN TYPE                           //
            ////////////////////////////////////////////////////////////////////////
            ////////////////////////////////////////////////////////////////////////

            // Additionally check VoidableContext. If this context is not
            // voidable and there is a void return then this is not valid.
            if (!voidableContext && !candidate.returnType) {
                continue;
            }

            let candidateReturnType =
                candidate.returnType &&
                candidate.returnType.contextualType(typeContext);

            // Lets first do checks and see if return type works
            if (expectedReturnType) {
                if (!candidateReturnType) {
                    // If we expect return and there is none then it is not a valid candidate
                    continue;
                }

                if (!candidateReturnType.castableTo(expectedReturnType.candidate)) {
                    // If the return type is not (up)castable to the expected return type,
                    // then this is not a valid candidate
                    continue;
                }
            }

            ////////////////////////////////////////////////////////////////////////
            ////////////////////////////////////////////////////////////////////////
            //                         CHECK ARGUMENTS                            //
            ////////////////////////////////////////////////////////////////////////
            ////////////////////////////////////////////////////////////////////////

            const candidateArgTypes = [];

            // If same arg length & function name we'll have to go through each
            // arg and check for compatibility.
            for (let j = 0; j < argc; j++) {
                let arg = args[j],
                    argName = arg.name?.value,
                    targetArgName = candidate.args[j].name,
                    targetArgType = candidate.args[j].type.contextualType(typeContext);

                // If there is an arg name, but they don't match then continue.
                if (argName && argName !== targetArgName) continue main;

                // Will store the candidate arg type for the given arg.
                let workingArgType = null;

                const argumentTypes = this.getChild(arg.value).resolve((type) => {
                    switch (type) {
                        // The child cannot be voidable
                        case ConstraintType.VoidableContext: return false;

                        case ConstraintType.RequestedTypeResolutionConstraint:
                            return new TypeCandidate(targetArgType);

                        case ConstraintType.SimplifyToPrecType:
                            return false;

                        // Right no they are no parent constraints. We'll resolve
                        // that later.
                        default: return negotiate(type);
                    }
                });

                // If we couldn't find a matching type, then this overload
                // doesn't work.
                if (argumentTypes.length === 0) continue main;

                // There shouldn't be more than one arguments given that we
                // specify a type resolution constraint.
                if (argumentTypes.length > 1) {
                    this.emit(
                        `Argument at index ${j} incorrectly had an ambiguous ` +
                        `value. Report this error.`,
                        e.AMBIGUOUS_EXPRESSION
                    );
                }

                const argumentType = argumentTypes[0];

                // If it was a prec type we will specify that we are using a
                // prec type in this case.
                if (argumentType.precType === true) {
                    tiebreakerBonus += 1;
                }

                candidateArgTypes.push(argumentType);
            }


            // If we are here then the two functions match.
            workingCandidates.push({
                candidate: candidate,
                argTypes: candidateArgTypes,
                returnType: candidateReturnType,
                tiebreakerBonus: tiebreakerBonus
            });
        }

        let topTiebreakerBonus = Math.max(...workingCandidates.map(_ => _.tiebreakerBonus));
        let bestCandidate = null;

        for (let i = 0; i < workingCandidates.length; i++) {
            const currentCandidate = workingCandidates[i];

            // If current function is best candidate and another is also best
            // candidate then we must throw error.
            if (currentCandidate.tiebreakerBonus === topTiebreakerBonus) {
                if (bestCandidate !== null) {
                    this.emit(
                        `Ambiguous use of function. Could not break tie between:\n${
                            [bestCandidate, currentCandidate]
                                .map(candidate => `    • ${candidate} (score: ${topTiebreakerBonus})`)
                                .join('\n')
                        }\n`,
                        e.AMBIGUOUS_CALL
                    );
                } else {
                    bestCandidate = currentCandidate;
                }
            }
        }

        if (bestCandidate === null) {

            if (simplifyToPrecType) {
                this.emit(
                    `Call to function does not match any valid candidates. Valid ` +
                    `candidates are:\n` +
                    candidates.map(
                        functionCandidate => `    • ${functionCandidate}`
                    ).join("\n") + (
                        typeContext.isEmpty() ? `` : `\nwhere ${typeContext} in context.`
                    ),
                    e.INVALID_FUNCTION_CALL
                );
            } else {
                return [];
            }

        } else {
            // Re-resolve subtypes to ensure unambiguous refs.
            for (let i = 0; i < argc; i++) {
                this.getChild(args[i].value).resolve((type) => {
                    switch (type) {
                        // The child cannot be voidable
                        case ConstraintType.VoidableContext: return false;

                        case ConstraintType.RequestedTypeResolutionConstraint:
                            return bestCandidate.argTypes[i];

                        default: return negotiate(type);
                    }
                });
            }

            // We must make sure we can access it
            if (!this.node.parentScope.scope.canAccess(bestCandidate.candidate)) {
                this.emit(
                    `Cannot use private function from this context.`,
                    e.INVALID_ACCESS
                );
            }

            // If we have succesfully found the one correct candidate...
            this.node.reference = bestCandidate.candidate;
            this.node.returnType = bestCandidate.returnType;
            return [new TypeCandidate(bestCandidate.returnType)];
        }
    }
}
