import t from '../../parser/nodes';

/**
 * This specifies valid decorators.
 */
const Annotations = new Map([
    ["primitive", [[1, 2], t.ClassStatement]],
    ["inline", [null, t.FunctionStatement]]
]);

export default Annotations;
