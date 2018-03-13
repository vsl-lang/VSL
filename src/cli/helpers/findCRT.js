import fs from 'fs-extra';

const crtPaths = [
    '/usr/lib64/crt1.o',
    '/usr/lib64/crti.o',
    '/usr/lib64/crt0.o',
    '/usr/lib/crt1.o',
    '/usr/lib/crti.o',
    '/usr/lib/crt0.o',
];

/**
 * Locates the CRT.
 * @param {ErrorManager} error error manager
 * @return {?string} `null` if could not find
 */
export default async function findCRT(error) {
    for (let i = 0; i < crtPaths.length; i++) {
        try {
            await fs.access(crtPaths[i], fs.constants.F_OK | fs.constants.R_OK)
        } catch(err) {
            continue;
        }
        return crtPaths[i];
    }

    error.cli(`could not locate crt for linkage. See (https://git.io/vslerr#crt-not-found)`);
}
