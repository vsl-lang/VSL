import fs from 'fs-extra';
import crypto from 'crypto';

/**
 * Manages temp files.
 */
export default class TempFileManager {
    static fileManagers = [];
    static willCleanup = true;

    /**
     * Creates temporary file manager.
     */
    constructor() {
        TempFileManager.fileManagers.push(this);

        /**
         * Root id of manager
         * @type {string}
         */
        this.id = `.vsl-temp${crypto.randomBytes(4).toString('hex')}`;

        // Stores list of created files
        this._files = [];
    }

    /**
     * Returns file path with extension
     * @param {string} extension File extension
     * @return {string} file paths
     */
    tempWithExtension(extension) {
        return this.createFile(`${this.id}.${extension}`);
    }

    /**
     * Creates temp file with extension and data, binary encoding.
     * @param {string} extension File extension
     * @param {Readable} data - stream for data
     * @return {Promise<string>} file name. Resolves when finished writing
     * @async
     */
    tempWithExtensionAndData(extension, data) {
        return new Promise((resolve, reject) => {
            const file = this.tempWithExtension(extension);
            const output = fs.createWriteStream(file, { flags: 'w' });
            data.pipe(output);
            data.on('end', () => {
                return resolve(file);
            });
        });
    }

    /**
     * Creates a file with name
     * @param {string} file filename
     * @return {string} the same file
     */
    createFile(file) {
        this._files.push(file);
        return file;
    }

    clean() {

        for (let i = 0; i < this._files.length; i++) {
            if (fs.existsSync(this._files[i])) {
                fs.unlinkSync(this._files[i]);
            }
        }

        this._files = [];
    }

    static clean() {
        if (TempFileManager.willCleanup) {
            for (let i = 0; i < TempFileManager.fileManagers.length; i++) {
                TempFileManager.fileManagers[i].clean();
            }
        }
    }
}

process.on('exit', TempFileManager.clean);
