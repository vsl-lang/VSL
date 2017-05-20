/**
 * Given a function's data, the outputs a mangled identifier which will uniquely
 * describe and reference its signature
 * 
 * @param {string} rootName - The root name or primary name of the function.
 *     e.g. in `foo(bar: baz)`, it would be `foo`
 * @param {string[][]} params - A [[name, type]] arrary where `name` and `type`
 *     are strings. type should be determined by `generateTypeMangle`.
 */
export default function generateFunctionMangle(rootName: string, params: string[][]) {
    var paramList = "";
    
    for (var i = 0; i < params.length; i++) {
        paramList += params[i][0] + ":" + params[i][1] + ",";
    }
    
    return rootName + "(" + paramList  + ")";
}