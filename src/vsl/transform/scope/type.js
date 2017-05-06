/**
 * Represents all information about a VSL type. This includes:
 * 
 *  - Type name
 *  - Declaration node
 *  - other?
 */
export default class Type {
    
    /**
     * @param {string} name - The name of the class as a string
     * @param {Node} source - The statement source
     */
    constructor(name: string, source: Node) {
        this.name = name;
        this.source = source;
    }
}