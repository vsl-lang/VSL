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
}
