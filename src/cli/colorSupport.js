import os from 'os';

const env = process.env;
function getSupport() {
    if (process.stdout && !process.stdout.isTTY) {
        return 0;
    }

    if (process.platform === 'win32') {
        // Node.js 7.5.0 is the first version of Node.js to include a patch to
        // libuv that enables 256 color output on Windows. Anything earlier and it
        // won't work. However, here we target Node.js 8 at minimum as it is an LTS
        // release, and Node.js 7 is not. Windows 10 build 10586 is the first Windows
        // release that supports 256 colors.
        const osRelease = os.release().split('.');
        if (
            Number(process.version.split('.')[0]) >= 8 &&
            Number(osRelease[0]) >= 10 &&
            Number(osRelease[2]) >= 10586
        ) {
            return 2;
        }

        return 1;
    }

    if ('CI' in env) {
        if ('TRAVIS' in env || env.CI === 'Travis') {
            return 1;
        }

        return 0;
    }

    if ('TEAMCITY_VERSION' in env) {
        return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION) ? 1 : 0;
    }

    if ('TERM_PROGRAM' in env) {
        const version = parseInt((env.TERM_PROGRAM_VERSION || '').split('.')[0], 10);

        switch (env.TERM_PROGRAM) {
            case 'iTerm.app':
                return version >= 3 ? 3 : 2;
            case 'Hyper':
                return 3;
            case 'Apple_Terminal':
                return 2;
            // No default
        }
    }

    if (/^(screen|xterm)-256(?:color)?/.test(env.TERM)) {
        return 2;
    }

    if (/^screen|^xterm|^vt100|color|ansi|cygwin|linux/i.test(env.TERM)) {
        return 1;
    }

    if ('COLORTERM' in env) {
        return 1;
    }

    if (env.TERM === 'dumb') {
        return 0;
    }

    return 0;
}

let value = getSupport();

export default {
	has256: value >= 2,
	has16m: value >= 3
}
