import fs from 'fs-extra';

const crtPaths = [
    '/usr/lib/crt0.o',
    '/usr/lib/crt1.o',
    '/usr/lib/crti.o'
];

/**
 * Locates the CRT.
 * @return {?string} `null` if could not find
 */
export default async function findCRT() {
    for (let i = 0; i < crtPaths.length; i++) {
        try {
            await fs.access(crtPaths[i], fs.constants.F_OK | fs.constants.R_OK)
        } catch(err) {
            continue;
        }
        return crtPaths[i];
    }

    return null;
}
