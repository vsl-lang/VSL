import BackendWatcher from '../../BackendWatcher';
import BackendError from '../../BackendError';
import t from '../../../parser/nodes';

import ScopeInitItem from '../../../scope/items/scopeInitItem';
import getFunctionName from '../helpers/getFunctionName';
import toLLVMType from '../helpers/toLLVMType';

import { alloc } from '../helpers/MemoryManager'

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

        // Then, with the callee
        let callee = backend.module.getFunction(calleeName);

        // Check if callee is generated yet. If not we'll generate it.
        if (!callee) {
            let calleeNode = initRef.source,
                parent = calleeNode.parentNode,
                name = calleeNode.relativeName;

            // Anon. IR builder
            let calleeContext = context.bare();

            callee = regen(name, parent, calleeContext);
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

        context.builder.createCall(
            callee,
            compiledArgs
        );

        toLLVMType(classRef, backend);
    }
}
