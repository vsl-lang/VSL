import Linker from '../Linker';
import commandExists from 'command-exists';
import { execFile } from 'child_process';

function execPromise(command, args) {
    return new Promise((resolve, reject) => {
        execFile(command, args, {
            encoding: 'utf8'
        }, (error, stdout, stderr) => {
            if (error) reject(error);
            if (stderr) reject(stderr);
            resolve(stdout.trim());
        })
    });
}

/**
 * The Clang compiler toolchain
 */
export default class Clang extends Linker {
    /** @override */
    constructor() {
        super("clang");
    }

    /**
     * We can only pass `-arch` on darwin
     * @return {boolean}
     * @override
     */
    async check() {
        return process.platform === 'darwin';
    }

    /**
     * Returns list of linkage args for options.
     * @param  {LinkageOptions}  options
     * @return {Promise}         Resolves to array of options
     */
    async getArgumentsForLinkage(options) {
        return [
            ...options.files,
            '-arch', options.arch,
            ...options.libraries
                .map(library => `-l${library}`),
            '-o', options.output
        ]
    }
}
