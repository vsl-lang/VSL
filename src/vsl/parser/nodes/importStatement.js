import Node from './node';

/**
 * import staetment.
 */
export default class ImportStatement extends Node {
    /**
     * Creates
     *
     * @param {string} name - module name
     * @param {Object} position a position from nearley
     */
    constructor(name, position) {
        super(position);

        /**
         * @type {string}
         */
        this.name = name;
    }

    clone() {
        return new ImportStatement(
            this.name
        )
    }

    /** @override */
    get children () {
        return [];
    }

    /** @override */
    toString() {
        return `import ${this.name}`;
    }
}
