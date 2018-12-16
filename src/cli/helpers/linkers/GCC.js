import Linker from '../Linker';

/**
 * The GCC compiler.
 */
export default class Gcc extends Linker {
    /** @override */
    constructor() {
        super(["gcc-8", "gcc-7", "gcc"]);
    }

    /**
     * Returns list of linkage args for options.
     * @param  {LinkageOptions}  options
     * @return {Promise}         Resolves to array of options
     */
    async getArgumentsForLinkage(options) {
        return [
            ...options.files,

            `-march=${options.triple.arch}`,

            ...(options.enableLTO ?
                [`-flto`] :
                []),

            ...options.libraries
                .map(library => `-l${library}`),

            '-o', options.output
        ]
    }
}
