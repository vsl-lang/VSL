/**
 * Represents the actual module and the values. DO NOT directly modify ANY value
 */
export default class VSLModule {
    static TargetType = {
        'dynamic': 1,
        'static': 2,
        'executable': 3
    }
    
    /**
     * Empty VSLModule, use {@link Module} to create one of these.
     */
    constructor() {
        /**
         * The name of the module.
         * @type {string}
         */
        this.name = null;
        
        /**
         * The description of the module
         * @type {string}
         */
        this.description = null;
        
        /**
         * The output type, one of `TargetType`, default is `executable`
         * @type {VSLModule.TargetType}
         */
        this.target = VSLModule.TargetType.executable;
        
        /**
         * Raw list of all source files. This is a list with all globs and such
         * expanded. Paths should be absolute
         *
         * @type {string[]}
         */
        this.sources = [];
    }
}
