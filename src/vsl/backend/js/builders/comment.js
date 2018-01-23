const CommentType = {
    Line: "Line",
    Block: "Block"
};

export default function Comment(string, type = CommentType.Line) {
    return { type: type, value: string }
}

Comment.Type = CommentType;
