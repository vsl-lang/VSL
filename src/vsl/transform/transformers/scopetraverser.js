import Traverser from '../traverser';
import * as t from '../../parser/nodes/';

/**
 * Handles scoping. This resolved and mangles identifiers. Latter transformers
 * will not have to verify scope or such. This will emit errors if scoping or
 * access errors occur.
 * 
 * Each scope is defined by a `t.CodeBlock` node and if a `get Node#identifierPath()`
 * call does not return nil; the returned {@link Identifier} is then taken as the
 * identifier to declare a variable as.
 * 
 * See: {@link Transformer}
 */
export default class ScopeTraverser extends Traverser {
    constructor() {
        super();
        
        // This is basically a stack of the current scope.
        // For a normal app this would look roughy like:
        // [ STL, Libraries, Global ]
        // specify STL to provide the base STL info
        this.scope = [];
    }
    
    /** @override */
    receivedNode(parent: Node | Node[], name: string) {
        let node = parent[name];
        if (node === null) return;
        
        // If the parent is a code block, we want to add it to the scope
        // This builds a stack of the scope tree, so for a typical top-level
        // class this might look like:
        //     libvsl, MyClass.vsl, MyClass
        // Each file would have it's own top-level preqeued block.
        if (node instanceof t.CodeBlock) {
            this.scope.push(node);
        }
        
        // Store the current scope for brevity
        const currentScope = this.scope[this.scope.length - 1];
        
        currentScope
        
        
        // Set parent scope for transformers
        node.parentScope = currentScope || null;
    }
    
    /** @override */
    finishedNode(parent: Node | Node[], name: string) {
        if (parent[name] instanceof t.CodeBlock) {
            this.scope.pop()
        }
    }
}