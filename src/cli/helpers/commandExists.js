import commandExists from 'command-exists';

/**
 * Returns if a command exists
 * @param  {string} command command name
 * @return {boolean}        if it exists
 */
export default async function(command) {
    try {
        await commandExists(command);
        return true;
    } catch(error) {
        return false;
    }
}
