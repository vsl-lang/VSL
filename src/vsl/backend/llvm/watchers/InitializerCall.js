import BackendWatcher from '../../BackendWatcher';
import BackendError from '../../BackendError';
import t from '../../../parser/nodes';

import ScopeInitItem from '../../../scope/items/scopeInitItem';
import getFunctionInstance from '../helpers/getFunctionInstance';
import toLLVMType from '../helpers/toLLVMType';
import { getTypeOffset } from '../helpers/layoutType';
import getDefaultInit from '../helpers/getDefaultInit';

import { Key } from '../LLVMContext';
import { alloc } from '../helpers/MemoryManager';
import * as llvm from 'llvm-node';

export default class LLVMInitializerCall extends BackendWatcher {
    match(type) {
        return type instanceof t.FunctionCall && type.reference instanceof ScopeInitItem;
    }

    receive(node, tool, regen, context) {
        const backend = context.backend;

        // Get the parent type context.
        const parentTypeContext = context.typeContext;

        // Get the type context
        const typeContext = node.typeContext.propogateContext(parentTypeContext);

        // Get the init function item.
        const initRef = node.reference;
        if (initRef === null) {
            throw new BackendError(
                `Initializer call is ambiguous. Multiple possible references.`,
                node.head
            );
        }

        // Try to get what type is being initialized (should be a class meta type).
        const classRef = node.returnType?.contextualType(parentTypeContext);
        if (!classRef) {
            throw new BackendError(
                `Initializer call is ambiguous. Multiple possible references.`,
                node.head
            );
        }

        // Type of the class in LLVM.
        const classType = toLLVMType(classRef, context);

        // Size of the class in bytes
        const sizeOfClass = backend.module.dataLayout.getTypeStoreSize(classType.elementType);




        // Create context for intializer
        const ctx = context.bare();
        ctx.typeContext = typeContext;

        // Then, with the callee. We'll either get initializer or we'll get the
        //  default init
        let callee;
        if (initRef.isDefaultInit) {
            callee = getDefaultInit(classRef, ctx, regen);
        } else {
            // We only need to pass type context to function instance because
            // the default init never even refs the generic params.
            callee = getFunctionInstance(initRef, ctx, regen);
        }


        // Allocate space for struct
        // malloc() returns a void* (i8*) so lets also convert that to the
        //  pointer of correct type.
        const allocCall = alloc(sizeOfClass, context);
        const instance = context.builder.createBitCast(
            allocCall,
            classType
        );


        // Compile the arguments
        let compiledArgs = [instance];
        for (let i = 0; i < node.arguments.length; i++) {
            let value = regen('value', node.arguments[i], context);
            compiledArgs.push(value);
        }


        return context.builder.createCall(
            callee,
            compiledArgs
        );
    }
}
