/**
 * @typedef {Object} DataSourceType
 * @property {Symbol} file - Provide file path as string.
 * @property {Symbol} data - Provide string with file data. Will show up as <buffer>
 */
export default {
    file: Symbol('Toolchain.DataSourceType.File'),
    data: Symbol('Toolchain.DataSourceType.Data')
};
