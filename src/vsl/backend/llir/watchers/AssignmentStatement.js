import BackendWatcher from '../../BackendWatcher';
import * as utils from '../utils';
import t from '../../../parser/nodes';

export default class LLIRAssignmentStatement extends BackendWatcher {
    static type = t.AssignmentStatement
    
    receive(node, backend, stream, tool, regen) {
        // They are two important things we need to know, 1) if it's a top-level
        // 2) if it's a complex type. Meaning if it's initalized to a literal
        // we'd need to layout that literal in the DATA section and assign the
        // register for this statement to it.
        
        let name = node.identifier.identifier.identifier.rootId;

        // If this is top-level we're going to do some special assignment
        if (node.parentScope.rootScope === true) {
            // In this case we're going to need to verify that this top-level
            // value is indeed a constant
            
            // Additionally the context is needed to check for constant-ness
            // we can obviously assume that the transformers have checked that
            // but we'll choose how to carry on
            let statement = `@${name} = `;

            let access;
            if (node.access.indexOf('public') > -1) access = 'global';
            else access = 'private';

            // Add access of declaration (used in ELF linkage).
            statement += access + " ";

            // Again if it's a `const` vs `let` we'd do `constant` in the IR
            if (node.type === t.AssignmentType.Constant) {
                statement += "constant ";
            }

            let value = node.value;
            let typeName = utils.TypeName(utils.GetCandidate(node.value));
            
            statement += typeName + " ";
            statement += utils.Repr(value.expression);

            backend.declarations.push(statement);
        } else {
            
        }
    }
}
