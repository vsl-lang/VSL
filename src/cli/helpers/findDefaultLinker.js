import Linker from './Linker';
import findCRT from './findCRT';
import commandExists from 'command-exists';

import * as linkers from './linkers';

const linkerList = [
    linkers.Clang,
    linkers.GCC,
    linkers.LD
];

/**
 * Gets default linker for system
 * @param {ErrorManager} error - CLI error manager
 * @return {Linker}
 */
export default async function findDefaultLinker(error) {
    for (let i = 0; i < linkerList.length; i++) {
        const linker = new (linkerList[i])();
        const cmdName = linker.commandName;
        if (await commandExists(cmdName) && await linker.check()) {
            return linker;
        }
    }

    error.cli(`could not locate linker. See https://git.io/vslerr#linker-not-found`);
}
