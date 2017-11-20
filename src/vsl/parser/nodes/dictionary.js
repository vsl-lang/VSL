import Node from './node';

/**
 * Matches an dictionary literal.
 *
 * This matches a dictionary literal.
 */
export default class Dictionary extends Node {

    /**
     * Creates a wrapper for dictionaries
     *
     * @param {Map} dictionary the literal dictionary value of the literal
     * @param {Object} position a position from nearley
     */
    constructor (dictionary: object, position: Object) {
        super(position);

        /** @type {Map} */
        this.dictionary = dictionary;
    }
    
    clone() {
        let newData = new Map();
        for (let [key, value] of this.dictionary) {
            newData.set(key.clone(), value.clone());
        }
        return new Dictionary(newData);
    }

    /** @override */
    get children() {
        return null;
    }
}
