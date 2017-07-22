import BackendWatcher from '../../BackendWatcher';
import t from '../../../parser/nodes';

export default class LLIRCodeBlock extends BackendWatcher {
    static type = t.CodeBlock
    
    receive(node, backend, stream, tool, regen) {
        let children = node.children;
        // i.e. top level; then we'll do different things (like moving top-
        // level code to the main block).
        if (node.rootScope === true) {
            for (let i = 0; i < children; i++) {
                if (children[i] instanceof t.DeclarationStatement) {
                    regen(i, children, backend.redirect(
                        item => this.rootMain.push(item)
                    ));
                }
            }
        }
    }
}
