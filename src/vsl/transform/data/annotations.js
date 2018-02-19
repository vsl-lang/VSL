import t from '../../parser/nodes';

/**
 * This specifies valid decorators.
 */
const Annotations = new Map([
    ["backend", [1]],
    ["_mockType", [1, t.ClassStatement]],
    ["_transparent", [[1, 4], t.FunctionStatement]],
    ["primitive", [[1, 2], t.ClassStatement]],
    ["inline", [null, t.FunctionStatement]]
]);

export default Annotations;
