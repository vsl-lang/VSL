/**
 * @typedef {Object} VSLToolchainDataSourceType
 * @property {Symbol} file - Provide file path as string.
 * @property {Symbol} data - Provide string with file data. Will show up as <buffer>
 */
export default {
    file: Symbol('VSLToolchainDataSourceType.File'),
    data: Symbol('VSLToolchainDataSourceType.Data')
};
