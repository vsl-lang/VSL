import TransformError from '../transformError';
import Transformation from '../transformation';
import Annotations from '../data/annotations';
import t from '../../parser/nodes';
import e from '../../errors';

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
        let [res, nodeType = null] = Annotations.get(name);
        if (res !== undefined) {
            // Check if correct type
            let parent = tool.nthParent(2);
            if (nodeType && !(parent instanceof nodeType)) {
                throw new TransformError(
                    `The annotation \`@${name}\` can only be used on items of ` +
                    `type ${nodeType.fancyName}. You used it on ${parent.fancyName}`,
                    node, e.BAD_ANNOTATION_PARENT
                );
            }
            
            if (res === null && node.args !== null) {
                throw new TransformError(
                    `Annotation \`${name}\` does not take any arguments but ` +
                    `you provided ${node.args.length}`,
                    node, e.ANNOTATION_NO_ARGS
                );
            } else if (res !== null) {
                let len = node.args ? node.args.length : 0;
                if (res.length === 2) {
                    if (len < res[0] || len > res[1]) {
                        throw new TransformError(
                            `Annotation \`${name}\` expected between ${res[0]} ` +
                            `and ${res[1]} args; you provided ${len}.`,
                            node, e.WRONG_ANNOTATION_ARG_COUNT
                        )
                    }
                } else if (len !== res) {
                    throw new TransformError(
                        `Annotation \`${name}\` expected exactly ${res} args; you` +
                        ` provided ${res} arguments.`,
                        node, e.WRONG_ANNOTATION_ARG_COUNT
                    );
                }
            }
        } else {
            throw new TransformError(
                `Used undeclared annotation of name ${name}`,
                node, e.UNKNOWN_ANNOTATION_REFERENCE
            );
        }
    }
}
