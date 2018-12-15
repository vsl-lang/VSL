import findCRT from '../findCRT';
import Linker from '../Linker';
import commandExists from '../commandExists';
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
        super(["ld"]);
    }

    /**
     * Only support LD if CRT can be found
     * @return {string}
     */
    async check() {
        return await findCRT() !== null;
    }

    /**
     * Returns list of linkage args for options.
     * @param  {LinkageOptions}  options
     * @return {Promise}         Resolves to array of options
     */
    async getArgumentsForLinkage(options) {

        const additionalArgs = [];

        // macOS requires the '-macosx_version_min' flag else it complains.
        if (await commandExists('sw_vers')) {
            additionalArgs.push(
                `-macosx_version_min`, await execPromise('sw_vers', ['-productVersion'])
            );
        }

        return [
            ...options.files,

            // Need to manually link CRT since not using toolchain
            await findCRT(options.errorManager),

            // macOS has its own -arch flag while Ubuntu and maybe others? seem
            // to use --architecture
            process.platform === 'darwin' ?
                `-arch` :
                `--architecture`,
            options.triple.arch,

            ...options.libraries
                .map(library => `-l${library}`),

            '-o', options.output,

            ...additionalArgs
        ]
    }
}
