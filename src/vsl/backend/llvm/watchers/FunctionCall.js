import BackendWatcher from '../../BackendWatcher';
import BackendError from '../../BackendError';
import BackendWarning from '../../BackendWarning';
import t from '../../../parser/nodes';

import { Key } from '../LLVMContext';
import isInstanceCtx from '../helpers/isInstanceCtx';
import getFunctionInstance from '../helpers/getFunctionInstance';
import tryGenerateCast from '../helpers/tryGenerateCast';
import { getVTableOffset } from '../helpers/layoutType';
import { getMethodOffsetInVTable } from '../helpers/VTable';

export default class LLVMFunctionCall extends BackendWatcher {
    match(type) {
        return type instanceof t.FunctionCall;
    }

    receive(node, tool, regen, context) {
        const backend = context.backend;

        // Get the env type context
        const parentTypeContext = context.typeContext;

        // Get type context of the function call
        const typeContext = node.typeContext.propogateContext(parentTypeContext);

        // Get list of possible overloads
        // at this point there should only beo ne
        const functionRef = node.reference;

        // Get args which should use default param
        const argPositionsTreatedOptional = node.argPositionsTreatedOptional;

        if (functionRef === null) {
            throw new BackendError(
                `Function call is ambiguous. Multiple possible references.`,
                node.head
            );
        }

        // See if the function is deprecated
        if (functionRef.isDeprecated) {
            context.backend.warn(new BackendWarning(
                functionRef.deprecationStatus,
                node
            ));
        }

        // See if takes self
        const takesSelfParameter = isInstanceCtx(functionRef);

        // Create context to generate function call with
        const ctx = context.bare();
        ctx.typeContext = typeContext;

        let vtableClass = functionRef.virtualParentMethod.owner.owner;
        const useVtable = !functionRef.implementationIsDefinite && vtableClass.dynamicDispatch;

        // Obtain the self parameter
        let headValue;
        if (takesSelfParameter) {
            if (node.implicitMethodReference) {
                headValue = regen('head', node, context);
            } else {
                if (!(node.head instanceof t.PropertyExpression)) {
                    throw new BackendError(
                        `Expected property with instance method.`,
                        node
                    );
                }

                headValue = regen('head', node.head, context);
            }
        }


        // Uncomment to debug function call types
        // console.log(`Calling ${functionRef} with ${typeContext}`)
        // console.log(`Caller ${node}`)

        // Create argument instruction list
        let compiledArgs = [];

        let callee;
        if (!useVtable) {
            callee = getFunctionInstance(functionRef, ctx, regen);

            // Compile self if it accepts one.
            if (takesSelfParameter) {
                // Get the value
                compiledArgs.push(headValue);
            }
        } else {
            const headType = node.head.baseRef;
            vtableClass = vtableClass.selfType.contextualType(headType.getTypeContext());

            // If vtable we'll cast to the vtable class.
            // Get the self param
            const selfParameter = tryGenerateCast(
                headValue,
                headType,
                vtableClass,
                context
            );

            compiledArgs.push(selfParameter);

            // Extract the function from the VTable and set that as the callee
            const vtable = getVTableOffset(selfParameter, vtableClass, context);
            callee = context.builder.createLoad(
                getMethodOffsetInVTable(
                    vtable,
                    vtableClass,
                    functionRef.virtualParentMethod,
                    context
                )
            );
        }


        // Compile the arguments. This handles optional arguments
        for (let i = 0, k = 0; i < functionRef.args.length; i++, k++) {
            let value;

            if (argPositionsTreatedOptional.includes(i)) {
                // If the argument is optional...
                const optionalContext = context.clone();

                // Locate the default expression
                const defaultExprArg = functionRef.args[i].node.defaultValue;

                // Give it the self parameter is appropriate
                optionalContext.selfReference = takesSelfParameter ? compiledArgs[0] : null;

                // And generate the argument
                value = regen(defaultExprArg.relativeName, defaultExprArg.parentNode, optionalContext);
                k--;
            } else {
                const calleeArgType = node.argumentReferences[k].contextualType(parentTypeContext);
                const callerArgType = functionRef.args[i].type.contextualType(typeContext);

                value = tryGenerateCast(
                    // Generate the argument
                    regen('value', node.arguments[k], context),
                    // Perform implicit casts to function param type
                    calleeArgType,
                    callerArgType,
                    context
                );
            }
            compiledArgs.push(value);
        }

        // Uncomment to debug function calls

        // console.log(`Calling ${functionRef.toString()} where ${typeContext}`)
        // console.log(node.argumentReferences.map(a=>a.contextualType(parentTypeContext).toString()));
        // console.log(functionRef.args.map(a=>a.type.contextualType(typeContext).toString()));
        // console.log(compiledArgs.map(x=>x.type.toString()));
        // console.log(callee.type.elementType.getParams().map(String));
        // console.log(parentTypeContext.toString());
        // console.log(node.typeContext.toString());

        // Do a check that the types are equal
        // if (callee.getArguments().length !== compiledArgs.length) {
        //     throw new TypeError(`attempted to create call with mismatch arg counts`);
        // }
        //
        // if (compiledArgs.some((arg, index) =>
        //     !callee.type.elementType.getParamType(index).equals(arg.type))) {
        //         throw new TypeError('attempted to create call with mismatch types');
        // }

        let result = context.builder.createCall(
            callee,
            compiledArgs
        );

        return result;
    }
}
