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
        this.sender = (f) => f(null);

        /**
         * All data emitted by the stream
         * @param {string}
         */
        this.data = "";

        /**
         * You can set this for better error reporting and debug info by
         * naming the streams. Optimally with the file path if applicable in
         * your environment.
         *
         * This is set to hoisted nodes (shared).
         *
         * @type {string}
         */
        this.sourceName = null;

        /** @private */
        this.warningListeners = [];

        /** @type {?CompilationGroup} */
        this.owningGroup = null;
    }

    /**
     * Listens for data finishes evaluating when data is obtained. Call this in
     * a loop checking for `null`.
     *
     * @return {?string} string with the data or null if there is no data
     * @example
     * let data;
     * while(null !== (data = await stream.receive())) {
     *     output.feed(data);
     * }
     */
    async receive() {
        return new Promise((resolve, reject) => {
            const res = (data) => {
                this.data += data;
                resolve(data);
            }

            // If there is no buffered stuff let's manually request some more
            // data
            if (this.dataBuffer.length === 0) {
                this.sender((data) => res(data));
            } else {
                res(this.dataBuffer.shift());
            }
        });
    }

    /**
     * Registers a warning listener.
     * @param {Function} listener - Listener to call with {@link BackendWarning}
     */
    registerWarningListener(listener) {
        this.warningListeners.push(listener);
    }

    /**
     * Emits a warning
     * @param {BackendWarning} warning
     */
    emitWarning(warning) {
        for (let i = 0; i < this.warningListeners.length; i++) {
            this.warningListeners[i](warning);
        }
    }

    /**
     * Sends a string of data to the receiver
     * @param  {string} data The data to send.
     */
    send(data) {
        this.dataBuffer.push(data);
    }

    /**
     * Call this with a callback to specify behavior when the compiler wants
     * more data.
     *
     * @param {func(f: func(data: ?string))} callback - function which calls the
     *                                                callback with the string
     *                                                and null if there is no
     *                                                more data.
     *
     * @example
     * stream.handleRequest(callback => {
     *      getData(data => callback(data));
     * })
     */
    handleRequest(callback) {
        this.sender = callback;
    }
}
