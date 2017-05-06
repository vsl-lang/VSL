import Transverser from '../transverser';
import * as Scope from '../scope/';
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
export default class ScopeTransverser extends Transverser {
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
        if (node instanceof t.CodeBlock) {
            this.scope.push(node);
        }
        
        
        let identifierPath = null;
        // Handle new identifier declarations
        if (identifierPath = node.identifierPath) {
            if (identifierPath instanceof t.TypedIdentifier) {
                let id = identifierPath.identifier;
                let name = id.identifier;
                let type = id.type;
                
                // If type key is variable
                let mutable = node.type === t.AssignmentType.Variable
                
                this.scope[this.scope.length - 1].scope.set(
                    name,
                    new Scope.Id(
                        mutable,
                        type,
                        node
                    )
                );
                
            } else {
                let name = identifierPath.identifier;
                let result = null;
                
                this.scope[this.scope.length - 1].scope.set(
                    name,
                    node
                );
            }
        }
        
        node.parentScope = this.scope[this.scope.length - 1] || null;
        
    }
}