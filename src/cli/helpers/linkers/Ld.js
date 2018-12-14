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
 * Typical LD linker available on most *nix systems
 */
export default class Ld extends Linker {
    /** @override */
    constructor() {
        super("ld");
    }

    /**
     * Returns list of linkage args for options.
     * @param  {LinkageOptions}  options
     * @return {Promise}         Resolves to array of options
     */
    async getArgumentsForLinkage(options) {

        const additionalArgs = [];

        // macOS requires the '-macosx_version_min' flag
        if (await commandExists('sw_vers')) {
            additionalArgs.push(
                `-macosx_version_min`, await execPromise('sw_vers', ['-productVersion'])
            );
        }

        return [
            ...options.files,
            '-arch', options.arch,
            ...options.libraries
                .map(library => `-l${library}`),
            '-o', options.output,

            ...additionalArgs
        ]
    }
}
