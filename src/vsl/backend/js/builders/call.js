export default function Call(callee, args) {
    return {
        type: "CallExpression",
        callee,
        arguments: args
    }
}
