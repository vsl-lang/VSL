import net from 'net';
import lz4 from 'lz4';

import ASTSerializer from '../vsl/parser/ASTSerializer';

/**
 * Client for a VSL compilation server
 */
export default class CompilationServerClient {

    /**
     * Creates client for a specific server. You can then use this client for
     * multiple things.
     *
     * @param {Object} server - This is the object specifying the server. An
     *                        object is in the form `{ path }` or `{ port }`
     *                        or `{ port, host }`
     */
    constructor(server) {
        /**
         * TCP/ICP server
         * @type {Object}
         */
        this.server = server;
    }

    /**
     * Sends a parse request to the server. Async
     * @param {ReadableStream} inputStream - Readable stream
     * @param {?Object} options - Additional options for decoder
     * @return {CodeBlock} output AST
     * @async
     */
    parse(inputStream, options = {}) {
        return new Promise((resolve, reject) => {

            const encoder = lz4.createEncoderStream();
            const decoder = lz4.createDecoderStream();
            const connection = net.createConnection(this.server);

            connection.on('connect', () => {
                // Ready to send data
                inputStream.pipe(encoder).pipe(connection);

                // Now parse the returned AST
                ASTSerializer.decodeFrom(connection, options)
                    .catch(reject)
                    .then(resolve);
            });

        });
    }

}
