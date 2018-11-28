import t from '../../parser/nodes';

/**
 * This specifies valid decorators. This has the format:
 * `[annotationName, [ annotationArgCount, annotationType ]]`
 *
 * annotationType is the class node of the node type of which the annotation is
 * allowed.
 *
 * annotationArgCount is either `[n]` in which it must have `n` args or `[a, b]`
 * where it must have at least `a` args and at most `b` args.
 */
const Annotations = new Map([
    ["backend", [ [1] ]],
    ["mock", [ [1], t.ClassStatement]],
    ["dynamic", [ [1], t.ClassStatement]],
    ["primitive", [[1, 2], t.ClassStatement]],
    ["booleanProvider", [[0], t.ClassStatement]],
    ["staticEnumProvider", [[0], t.ClassStatement]],
    ["inline", [[0, 1], t.FunctionStatement]],
    ["delegate", [[1], t.FunctionStatement]],
    ["linkage", [[1], t.FunctionStatement]],
    ["foreign", [[1], t.FunctionStatement]]
]);

export default Annotations;
