/**
 * An error type thrown by a module, will have more information depending on
 * error type
 */
export default class ModuleError {
    /**
     * @param {string} message - A human readable error message
     * @param {number} type - something of `ModuleError.Type` representing the
     *                      type of the error
     * @param {Object} data - Data representing the error
     */
    constructor(message, type, data = {}) {
        this.message = message;
        this.type = type;
        this.data = data;
    }

    static type = {
        modulePathNotFound: 0,
        moduleNoYml: 1,
        moduleNoName: 2,
        moduleInvalidName: 3,
        invalidVersion: 4,
        invalidSourceType: 5,
        invalidSourceItemType: 6,
        invalidStdlibSpec: 6,
        invalidTargetType: 7,
        invalidDocgenConfig: 8
    }
}
