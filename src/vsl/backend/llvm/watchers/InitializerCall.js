import BackendWatcher from '../../BackendWatcher';
import BackendError from '../../BackendError';
import t from '../../../parser/nodes';

import ScopeInitItem from '../../../scope/items/scopeInitItem';
import getFunctionName, { getFunctionInstance } from '../helpers/getFunctionName';
import toLLVMType from '../helpers/toLLVMType';
import { getTypeOffset } from '../helpers/layoutType';
import getDefaultInit from '../helpers/getDefaultInit';

import { alloc } from '../helpers/MemoryManager'
import * as llvm from 'llvm-node';

export default class LLVMInitializerCall extends BackendWatcher {
    match(type) {
        return type instanceof t.FunctionCall && type.headRef instanceof ScopeInitItem;
    }

    receive(node, tool, regen, context) {
        const backend = context.backend;

        const initRef = node.headRef;

        if (initRef === null) {
            throw new BackendError(
                `Initializer call is ambiguous. Multiple possible references.`,
                node.head
            );
        }

        const classRef = initRef.initializingType;
        const classType = toLLVMType(classRef, backend);

        const sizeOfClass = backend.module.dataLayout.getTypeStoreSize(classType.elementType);

        // Get the name of this function so we can ref it
        const calleeName = getFunctionName(initRef);

        // Then, with the callee. We'll either get initializer or we'll get the
        //  default init
        let callee;
        if (initRef.isDefaultInit) {
            callee = getDefaultInit(classRef, context, regen);
        } else {
            callee = getFunctionInstance(initRef, regen, context);
        }

        // Allocate space for struct
        // malloc() returns a void* (i8*) so lets also convert that to the
        //  pointer of correct type.
        const allocCall = alloc(sizeOfClass, context);
        const instance = context.builder.createBitCast(
            allocCall,
            classType
        );

        // Create argument instruction list
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
