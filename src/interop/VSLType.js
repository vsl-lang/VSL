/**
 * Represents abstract VSL native interface type.
 * @abstract
 */
export default class VSLType {

    /**
     * @param {Buffer} data - A buffer with the data.
     */
    constructor(data) {
        /**
         * Underlying data
         * @type {Buffer}
         */
        this.data = data;
    }

    /**
     * Obtain the buffer representation of the class
     * @return {Buffer}
     */
    toBuffer() { return this.data; }

    /**
     * Obtain the array buffer representation of the class
     * @return {ArrayBuffer}
     */
    toArrayBuffer() { return this.data.buffer; }


}
