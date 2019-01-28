/**
 * Generates method node
 * @param {Object} node - AST node
 * @param {WASMBindgen} bindgen - Bindgen
 * @param {Object} [o={}] - additional options
 * @param {boolean} [o.isStatic=false] - if is static
 * @param {boolean} [o.parentClassName="self"] - name of parent class.
 * @return {string} VSL string
 */
export default function MethodGenerator(node, bindgen, { isStatic = null, parentClassName = "self" } = {}) {
    if (!node.body) return "/* skipped method */";

    const functionName = node.body.name.value;
    const returnType = bindgen.formatType(node.body.idlType);

    const args = node.body.arguments
        .map(({ name, idlType: type, optional }) => {
            const argName = bindgen.formatIdentifier(name);
            const argType = bindgen.formatType(type);

            const optionalString = optional ? ` = ${argType}::JS_UNDEFINED` : ``;

            return `${argName}: ${argType}${optionalString}`
        })
        .join(", ");

    const argCount = node.body.arguments.length;

    const modifiers = (isStatic ? `static ` : ``);
    const self = isStatic ? `${parentClassName}.toJSValue()` : `self`;

    let dispatchAllocations,
        dispatchCall,
        frame = null;

    if (argCount > 0) {
        // Prepare arguments
        let totalSize = 1;
        const argFrames = [];

        for (let i = 0; i < node.body.arguments.length; i++) {
            const arg = node.body.arguments[i];
            const argType = bindgen.formatType(arg.idlType);
            const argName = bindgen.formatIdentifier(arg.name);

            switch (argType) {
                case 'String':
                    // Pass VSL string pointer
                    totalSize += 1 + 4; // 1=type size, 4=string ptr size
                    const createStringFrame = `frameOffset.store(value: 0xA0)
frameOffset = frameOffset.offset(by: 1)
(Pointer<UInt32>::frameOffset).store(value: UInt32::${argName})
frameOffset = frameOffset.offset(by: 4)`;
                    argFrames.push(createStringFrame);
                    break;

                case 'Int':
                    // Pass VSL int directly
                    totalSize += 1 + 4; // 1=type size, 4=4-byte int
                    const createIntFrame = `frameOffset.store(value: 0xA1)
frameOffset = frameOffset.offset(by: 1)
(Pointer<UInt32>::frameOffset).store(value: UInt32::${argName})
frameOffset = frameOffset.offset(by: 4)`;
                    argFrames.push(createIntFrame);
                    break;

                default:
                    // Interpret as JS object
                    totalSize += 1 + 4; // 1=type size, 4=obj ptr size
                    const createObjFrame = `frameOffset.store(value: 0x00)
frameOffset = frameOffset.offset(by: 1)
(Pointer<UInt32>::frameOffset).store(value: UInt32::${argName})
frameOffset = frameOffset.offset(by: 4)`;
                    argFrames.push(createObjFrame);
                    break;
            }
        }

        // Create dispatch call
        dispatchAllocations = `// stack frame
const frame = Pointer<UInt8>.alloc(count: ${totalSize})
frame.store(value: ${argCount})

let frameOffset: Pointer<UInt8> = frame.offset(by: 1)
${argFrames.join("\n")}`;

        frame = 'frame';

        dispatchCall = `${self}.dispatch(target: "${functionName}", stackFrame: frame)`;
    } else {
        dispatchAllocations = `// noargs`;
        dispatchCall = `${self}.dispatchAnon(target: "${functionName}")`;
    }

    const frameFreeStatement = frame ? `
${frame}.free()` : '';

    const isVoid = returnType === "Void";
    let dispatchStatement;
    if (isVoid) {
        dispatchStatement = `${dispatchCall}${frameFreeStatement}`;
    } else {
        dispatchStatement = `const dispatchResult: ${returnType} = ${returnType}::${bindgen.transformValue(dispatchCall, returnType)}${frameFreeStatement}
return dispatchResult`
    }


    return `public ${modifiers}func ${functionName}(${args}) -> ${returnType} {
${bindgen.indent(dispatchAllocations)}
${bindgen.indent(dispatchStatement)}
}`;
}
