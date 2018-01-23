export default function Block(body = []) {
    return {
        type: "BlockStatement",
        body
    }
}
