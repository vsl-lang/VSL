import t from '../../parser/nodes';

/**
 * This specifies valid decorators.
 */
const Annotations = new Map([
    ["backend", [1]],
    ["mock", [1, t.ClassStatement]],
    ["dynamic", [1, t.ClassStatement]],
    ["primitive", [[1, 2], t.ClassStatement]],
    ["booleanProvider", [null, t.ClassStatement]],
    ["inline", [null, t.FunctionStatement]],
    ["delegate", [1, t.FunctionStatement ]]
]);

export default Annotations;
