import BackendWatcher from '../../BackendWatcher';
import t from '../../../parser/nodes';

export default class LLIRCodeBlock extends BackendWatcher {
    static type = t.CodeBlock
    
    receive(node, backend, stream, tool, regen) {
        let children = node.statements;

        // i.e. top level; then we'll do different things (like moving top-
        // level code to the main block).
        if (node.rootScope === true) {
            for (let i = 0; i < children.length; i++) {
                // We want to have declaration statements to be top-level
                // compiled. Example: functions, classes. Assignments do NOT go
                // into as a declaration. They are treated specially
                //
                // Otherwise we'll put top-level expressions/ifs in the rootMain
                // The traversers will ensure we won't have mixes
                if (
                    children[i] instanceof t.DeclarationStatement &&
                    !(children[i] instanceof t.AssignmentStatement)
                ) {
                    // If it is a declaration statement we'll redirect the
                    // function generator's output to the declaration array.
                    // That way nested declarations appear at the top-level
                    // rather than inside their parent scope.
                    
                    let temp = "";
                    regen(i, children, backend.redirect(
                        item => temp += item
                    ));
                    
                    this.declarations.push(temp);
                } else {
                    // This is if we have a top-level expression/if/etc.
                    // i.e. not a declaration meaning we'll have to put it into
                    // the main function (in the generated IR)
                    regen(i, children, backend.redirect(
                        item => backend.rootMain.push(item)
                    ));
                }
            }
        }
    }
}
