/**
 * This is the thing which is passed to a fixit and performs magic changes. Make
 * sure to get the new input from this.
 */
export default class FixItManager {
    /**
     * Create new FixItManager, but reccomended to use FixIt to actually process
     * the FixIt
     *
     * @param {string} source - Source code
     * @param {Node}   node   - Node to fix
     */
    constructor(source, node) {
        /** @private */
        this._source = source;
        
        /** @private */
        this._node = node;
    }
    
    /**
     * Readonly, evaluates to source code
     */
    get source() {
        return this._source;
    }
    
    /** @private */
    _splice(string, posA, length, replacement = "") {
        return string.substring(0, posA) + replacement + string.substring(posA + length);
    }
    
    /**
     * Removes a node from the source code. Does not affect AST.
     * @param  {Node} node the node to remove.
     */
    remove(node) {
        this._source = this._splice(
            this._source,
            this._node.position.index,
            this._node.position.length,
            ""
        );
    }
    
    /**
     * Replaces a node with a literal string.
     * @param {Node} node     Node to replace with string
     * @param {string} string string to replace node with
     */
    set(node, string) {
        this._source = this._splice(
            this._source,
            this._node.position.index,
            this._node.position.length,
            string
        );
    }
    
    /**
     * Inserts a string after the position of a node.
     * @param  {Node}   node   The desired node to replace.
     * @param  {string} string The string to insert after the node.
     */
    insertAfter(node, string) {
        this._source = this._splice(
            this._source,
            this._node.position.index + this._node.position.length,
            0,
            string
        );
    }
    
    /**
     * Replaces in the source code the restringified version of the source code.
     * @type {string}
     */
    restring() {
        this.set(this._node, this._node.toString());
    }
    
    /**
     * Gets the node which is being fix-it'd
     * @type {Node}
     */
    get node() {
        return this._node;
    }
    
    /**
     * Gets the applicable string representing the node in the source code
     * @type {string}
     */
    get str() {
        return this._source.substr(this._node.position.index, this._node.position.length);
    }
}
