import t from '../../parser/nodes';

/**
 * This specifies valid decorators.
 */
const Annotations = new Map([
    ["backend", [1]],
    ["_mockType", [[2, 3], t.ClassStatement]],
    ["primitive", [[1, 2], t.ClassStatement]],
    ["inline", [null, t.FunctionStatement]]
]);

export default Annotations;
