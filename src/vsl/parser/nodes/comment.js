import Node from './node';

export default class Comment extends Node {

    /**
     * Represents a comment on a node
     *
     * @param {string} content
     * @param {Object} position a position from nearley
     */
    constructor(content, position) {
        super(position);

        /** @type {string} */
        this.content = content;
    }

    /** @override */
    get children() {
        return null;
    }

    /** @override */
    toString() {
        return `// ${this.content}`;
    }
}
