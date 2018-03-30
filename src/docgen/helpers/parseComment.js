/**
 * Returns parsed comment body
 * @param {Comment[]}
 * @return {Object} in form `{ content }`
 */
export default function parseComment(comments) {
    const content = comments.map(comment => comment.content).join(" ");
    return { content };
}
