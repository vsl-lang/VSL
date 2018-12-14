import Linker from './Linker';
import findCRT from './findCRT';
import commandExists from 'command-exists';

import * as linkers from './linkers';

/**
 * Gets default linker for system
 * @param {ErrorManager} error - CLI error manager
 * @return {Linker}
 */
export default async function findDefaultLinker(error) {
    const linkerList = Object.values(linkers);
    for (let i = 0; i < linkerList.length; i++) {
        const linker = new (linkerList[i])();
        const cmdName = linker.commandName;
        if (await commandExists(cmdName)) {
            return linker;
        }
    }

    error.cli(`could not locate linker. See https://git.io/vslerr#linker-not-found`);
}
