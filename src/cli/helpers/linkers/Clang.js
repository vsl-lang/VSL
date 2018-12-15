import Linker from '../Linker';

/**
 * The Clang compiler toolchain
 */
export default class Clang extends Linker {
    /** @override */
    constructor() {
        super(["clang"]);
    }

    /**
     * Returns list of linkage args for options.
     * @param  {LinkageOptions}  options
     * @return {Promise}         Resolves to array of options
     */
    async getArgumentsForLinkage(options) {
        return [
            ...options.files,

            `--target=${options.triple.toString()}`,

            ...(options.disableLTO ?
                [] :
                [`-flto`]),

            ...options.libraries
                .map(library => `-l${library}`),

            '-o', options.output
        ]
    }
}
