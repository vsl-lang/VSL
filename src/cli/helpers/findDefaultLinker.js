import Linker from './Linker';
import findCRT from './findCRT';
import commandExists from 'command-exists';

let search = [
    { name: 'clang', args: () => [] },
    { name: 'gcc', args: () => [] },
    { name: 'ld', args: async (error) => [await findCRT(error)] }
];

/**
 * Gets default linker for system
 * @param {ErrorManager} error - CLI error manager
 * @return {Linker}
 */
export default async function findDefaultLinker(error) {
    for (let i = 0; i < search.length; i++) {
        const cmdName = search[i].name;
        if (await commandExists(cmdName)) {
            return new Linker(cmdName, await search[i].args(error));
        }
    }

    error.cli(`could not locate linker. See https://git.io/vslerr#linker-not-found`);
}
