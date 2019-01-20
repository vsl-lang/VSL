/**
 * Generates method node
 * @param {Object} node - AST node
 * @param {WASMBindgen} bindgen - Bindgen
 * @return {string} VSL string
 */
export default function MethodGenerator(node, bindgen) {
    if (!node.body) return "/* skipped method */";

    const functionName = node.body.name.value;
    const returnType = bindgen.formatType(node.body.idlType);

    const args = node.body.arguments
        .map(({ name, idlType: type }) => `${bindgen.formatIdentifier(name)}: ${bindgen.formatType(type)}`)
        .join(", ");

    const argCount = node.body.arguments.length;

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
    const dispatchAllocations = `// stack frame
const frame = Pointer<UInt8>.alloc(count: ${totalSize})
frame.store(value: ${argCount})

let frameOffset: Pointer<UInt8> = frame.offset(by: 1)
${argFrames.join("\n")}`;

    const dispatchCall = `self.dispatch(target: "${functionName}", stackFrame: frame)`;

    const isVoid = returnType === "Void";
    let dispatchStatement;
    if (isVoid) {
        dispatchStatement = `${dispatchCall}`;
    } else {
        dispatchStatement = `return ${returnType}::${dispatchCall}`
    }

    return `public func ${functionName}(${args}) -> ${returnType} {
${bindgen.indent(dispatchAllocations)}
${bindgen.indent(dispatchStatement)}
}`;
}
