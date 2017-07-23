/**
 * Represents a stream of data which a backend outputs. You can take this and
 * extract an encoded buffer. This is designed to be friendly with binary
 * formats.
 */
export default class BackendStream {
    /**
     * Creates empty stream.
     *
     * @param {func(data:string)} dataHook - runs everytime data is received,
     *                                     you don't have to specify this, only
     *                                     if you have a specific need.
     */
    constructor(dataHook) {
        /** @private */
        this.data = "";
        
        /** @private */
        this.dataHook = dataHook;
    }
    
    /**
     * Evaluates to output as a UTF-8 encoded string
     * @tyoe {string}
     */
    get utf8Value() {
        return this.data;
    }
    
    /**
     * Wr
     * @param  {strnig} string String to append/write to the stream
     * @return {BackendStream} same object for chaining
     */
    write(string) {
        this.data += string;
        if (this.dataHook) this.dataHook(string);
    }
}
