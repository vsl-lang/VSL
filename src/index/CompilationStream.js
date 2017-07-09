/**
 * An abstraction for any input to the compiler. Call `.data(data)` to signal
 * that data has arrived. Override `this.ready` to recieve
 */
export default class CompilationStream {
    /**
     * Create a compilation stream. You can use the methods to send/recieve
     * data.
     */
    constructor() {
        /** @private */
        this.dataBuffer = [];
        
        /** @private */
        this.pushData = () => void 0;
        
        /** @private */
        this.sender = (f) => f(null);
    }
    
    /**
     * Listens for data finishes evaluating when data is obtained.
     *
     * @return {?string} string with the data or null if there is no data
     */
    async receive() {
        return new Promise((resolve, reject) => {
            // If there is no buffered stuff let's manually request some more
            // data
            if (dataBuffer.length === 0) {
                sender((data) => resolve(data));
            } else {
                resolve(this.dataBuffer.unshift());
            }
        });
    }
    
    /**
     * Sends a string of data to the receiver
     * @param  {string} data The data to send.
     */
    send(data) {
        this.dataBuffer.push(data);
        this.pushData();
    }
    
    /**
     * Call this with a callback to specify behavior when the compiler wants
     * more data.
     *
     * @param {func(f: func(data: ?string))} callback - function which calls the
     *                                                callback with the string
     *                                                and null if there is no
     *                                                more data.
     */
    handleRequest(callback) {
        this.sender = callback;
    }
}
