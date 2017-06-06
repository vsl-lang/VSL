import TransformError from '../transformError.js';
import Transformation from '../transformation.js';
import Annotations from '../data/annotations';
import t from '../../parser/nodes';

/**
 * This validates decorators and ensures that their arguments and all are
 * conformant to the spec described in `data/decorators`. This does not do any
 * specific checks or transformations related to the decorators. This only 
 * ensures it is valid.
 */
export default class VerifyAnnotationSignature extends Transformation {
    constructor() {
        super(t.Annotation, "Verify::AnnotationSignature");
    }
    
    /** @overide */
    modify(node: Node, tool: ASTTool) {
        let name = node.name;
        let res = Annotations.get(name);
        if (res) {
            if (res === null && node.args !== null) {
                throw new TransformError(
                    `Annotation \`${name}\` does not take any arguments but ` +
                    `you provided ${node.args.length}`,
                    node
                );
            } else if (res !== null && node.args.length !== res) {
                throw new TransformError(
                    `Annotation \`${name}\` expected exactly ${res} args; you` +
                    ` provided ${res} arguments.`,
                    node
                );
            }
        } else {
            throw new TransformError(
                `Used undeclared annotation of name ${name}`,
                node
            );
        }
    }
}
