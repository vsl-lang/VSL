/**
 * An abstraction for any input to the compiler. Call `.data(data)` to signal
 * that data has arrived. Override `this.ready` to recieve
 */
export default class CompilationStream {
    /**
     * Create a compilation stream
     *
     * @param {func(data: string, close: func())} receiveData Called with data
     *                                                        when data is
     *                                                        obtained. The
     *                                                        `close` callback
     *                                                        is also called
     *                                                        when the receiver
     *                                                        will not receive
     *                                                        any more data.
     * @param {func()} receiveClose            Called when there is no more data
     */
    constructor(receiveData, receiveClose) {
        this.receiveData = receiveData;
        this.receiveClose = receiveClose;
        
        this.cloesClient = null;
    }
    
    /**
     * Sets up a client (sender) to the compilationStream
     *
     * @param {func()} close A function to signal to the sender to stop sending
     *                       any more data.
     */
    setupClient(close) {
        this.closeClient = close;
    }
    
    /**
     * _Send_ data to the stream.
     *
     * @param {string} data the data to send
     */
    data(data) {
        this.receiveClose(data, () => this.closeClient());
    }
    
    /**
     * Specify that there is no more data, do not call after a `.close()`
     */
    done() {
        this.receiveClose();
    }
}
