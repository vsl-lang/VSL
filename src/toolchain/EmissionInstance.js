import { spawn } from 'child_process';
import { Readable } from 'stream';

/**
 * This class represents a backend-compiled VSL instance and has a series of
 * methods which let you output and link the code where applicable.
 */
export default class EmissionInstance {
    /** @private */
    constructor(backend) {
        /** @private */
        this.backend = backend;
    }

    /**
     * Emits a raw human-readable IR bytecode stream as the return value as a
     * string.
     * @return {string}
     */
    async emitRaw() {
        return this.backend.getByteCode();
    }

    /**
     * Resolves to the IR bytecode as a stream.
     * @return {ReadableStream}
     */
    async emitRawStream() {
        const stream = new Readable();
        stream._read = () => {};

        stream.push(await this.emitRaw());
        stream.push(null)

        return stream;
    }

    /**
     * Emits bitcode to a path. If the optimization level is zero then no
     * optimizations are performed however by default the optimization level is
     * one.
     *
     * @param {string} path - Output `.bc` file path
     * @param {Object} [options={}] - configure output
     * @param {number} [options.optimizationLevel=1]
     */
    async emitBitcode(path, { optimizationLevel = 1 } = {}) {
        if (optimizationLevel === 0) {
            this.backend.writeBitCodeTo(path);
        }
    }

    /**
     * Interprets using the `lli` executable the VSL code. Resolves when
     * execution is finished
     * @async
     */
    async interpret() {
        const byteCode = await this.emitRawStream();
        await new Promise((resolve, reject) => {
            let lli = spawn('lli', [], {
                stdio: ['pipe', 'inherit', 'inherit']
            });

            byteCode.pipe(lli.stdin);

            lli.on('error', reject);
            lli.on('exit', resolve);
        });
    }
}
