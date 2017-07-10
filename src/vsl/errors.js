import t from './parser/nodes';

// remove - remove Node/Node[]
// set - replace literal string val w/
// insertAfter - inserts a string after a node
// restring - replace literal w/ Node.toString()
// str - Node literal value
// node - Node

export default {
    // Annotations
    BAD_ANNOTATION_PARENT: {
        fixits: [
            { d: "remove annotation", f: (n) => n.remove(n.node) },
        ]
    },
    ANNOTATION_NO_ARGS: {
        fixits: [
            { d: "remove all arguments", f: (n) => n.remove(n.node.args) },
            {
                d: "rename annotation",
                a: ["new name"],
                f: (n, a) => n.set(n.str.replace(n.node.name, a[0]))
            }
        ]
    },
    WRONG_ANNOTATION_ARG_COUNT: {
        fixits: [
            {
                d: "add argument",
                a: ["value"],
                f: (n, a) => { n.node.args.push(a[0]); n.restring() }
            },
            {
                d: "remove argument",
                a: ["number"],
                f: (n, a) => {
                    if(!n.node.args[+a]) { return 'invalid index' }
                    else { n.node.args.splice(+a, 1); n.restring() }
                }
            }
        ]
    },
    UNKNOWN_ANNOTATION_REFERENCE: {
        fixits: [
            {
                d: "rename annotation",
                a: ["new name"],
                f: (n, a) => n.set(n.node, n.str.replace(n.node.name, a[0]))
            },
            {
                d: "delete annotation",
                f: (n) => n.remove(n.node)
            }
        ]
    },
    
    // Functions
    FUNCTION_ARG_MISSING_TYPE: {
        fixits: [
            {
                d: "add type",
                a: ["type"],
                f: (n, a) => n.insertAfter(n.node.typedId.identifier, `: ${a[0]}`)
            }
        ]
    },
    
    // Identifier deductions
    DUPLICATE_DECLARATION: {},
    UNDECLARED_FUNCTION: {},
    UNDECLARED_IDENTIFIER: {},
    CANNOT_RESOLVE_IDENTIFIER: {}
}
