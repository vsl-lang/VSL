/**
 * Represents target triple
 */
export default class Triple {


    /**
     * Creates a target triple
     * @param {string} triple
     */
    constructor(triple) {
        /** @private */
        this.triple = triple;
    }

    /**
     * @type {string}
     */
    get arch() {
        return this.triple.split('-')[0] || 'UNKNOWN_ARCH';
    }

    /**
     * @type {?string}
     */
    get abi() {
        let parts = this.triple.split('-');
        return parts[3] || null;
    }

    /**
     * converts to a string
     * @return {string}
     */
    toString() {
        return this.triple;
    }

}
