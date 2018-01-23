export default function Lambda({ params, body, id = null }) {
    return {
        type: "FunctionExpression",
        params,
        body,
        id
    }
}
