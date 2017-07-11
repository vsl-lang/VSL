import Node from './node';

/**
 * References a top-level `import` statement which imports a module (hook).
 */
export default class ImportStatement extends Node {
    
    /**
     * Creates an import statement
     *
     * @param {string} name The name of the module to be imported.
     * @param {Object} position a position from nearley
     */
    constructor(name: string, position: Object) {
        super(position);
                
        /** @type {string} */
        this.name = name;
    }
    
    /** @override */
    get children() {
        return null;
    }
    
    /** @override */
    toString() {
        return `import ${this.name}`;
    }
}
