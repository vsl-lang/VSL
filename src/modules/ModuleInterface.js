import fs from 'fs-extra';
import _glob from 'glob';

// Because node-glob refuses Promise PRs this is a wrapper
const globSearch = (source, options) => new Promise(
    (resolve, reject) =>
        _glob(source, options, (error, files) =>
            error ? reject(error) : resolve(files))
);

/**
 * Interfaces between the module system and the file system, abstracted but does
 * use string paths so you may need to emulate a file system.
 *
 * You may implement the same interface as this and hook it onto
 * `Module.moduleInterface`, this itself implements a Node.js friendly
 * interface.
 */
export default class ModuleInterface {
    static shared = new ModuleInterface();

    /**
     * Checks if a path is a directory and exists.
     *
     * @param {string} path Path to the desired directory.
     * @return {boolean} `true` if exists and is a directory. False in all other
     *                   cases, should follow symlinks.
     */
    async isDirectory(path) {
        try {
            return (await fs.stat(path)).isDirectory();
        } catch(error) {
            return false;
        }
    }

    /**
     * Reads a file given a path
     *
     * @param {string} path - Path of the file to read
     * @return {string} It's a bad idea to load file into memory but the YAML
     *                       parser this uses doesn't go any other way.
     * @throws {ModuleError}
     */
    async readFile(path) {
        try {
            return await fs.readFile(path, {
                encoding: 'utf-8'
            });
        } catch(e) {
            throw e;
        }
    }

    /**
     * Expands a glob to an array of the files.
     *
     * @param {string} pattern - glob pattern
     * @param {string} root - root directory
     *
     * @return {string[]} absolute paths of values
     * @throws {Error} any resolution error.
     */
    async glob(pattern, root) {
        try {
            return await globSearch(pattern, {
                cwd: root,
                absolute: true
            })
        } catch(e) {
            throw e;
        }
    }
}
