import ModuleInterface from './ModuleInterface';
import ModuleError from './ModuleError';
import VSLModule from './VSLModule';

import semver from 'semver';
import yaml from 'js-yaml';
import path from 'path';

/**
 * Manages a module given a path to the module directory `module/`. This emits
 * `ModuleError` Errors so hook onto that.
 *
 * You may override the `Module.moduleInterface` class with a different class
 * implementing the `ModuleInterface` interface (Promise based) for comatibility
 * with a more JS platforms.
 */
export default class Module {
    /**
     * Creates a module given a path to the FOLDER which contains a `module.yml`
     *
     * @param {string} path - string to path of
     * @throws {ModuleError} thrown if the module does not exist.
     */
    constructor(path) {
        if (!Module.moduleInterface.isDirectory(path)) {
            throw new ModuleError(
                `Could not find module, \`${path}\` does not exist or is not ` +
                `a directory.`,
                ModuleError.type.modulePathNotFound,
                { path }
            );
        }
        
        /** @private */
        this.rootPath = path;
        
        /**
         * Path of the YML file
         * @type {string}
         */
        this.ymlPath = null;
        
        /**
         * The onwarning handler, you'll have to figure out how to handlle this
         * stuff
         * @type {Function}
         */
        this.onwarning = null;
        
        /**
         * Stores the actual values of the module
         * @type {VSLModule}
         */
        this.module = new VSLModule();
    }
    
    /** @private */
    handleWarning(...args) {
        if (this.onwarning) this.onwarning(...args);
    }
    
    /** @private */
    async setupModule(yaml) {
        
        ////////////////////////////////////////////////////////////////////////
        // .NAME
        ////////////////////////////////////////////////////////////////////////
        if (typeof yaml.name !== 'string') throw new ModuleError(
            `All modules must have a name, no name provided`,
            ModuleError.type.moduleNoName
        );
        
        if (!/^[A-Za-z_][A-Za-z_0-9]*$/.test(yaml.name)) throw new ModuleError(
            `Modules can only have names with letters and underscores, ` +
            `numbers for following characters`,
            ModuleError.type.moduleInvalidName,
            { name: yaml.name }
        )
        
        this.module.name = yaml.name;
        
        ////////////////////////////////////////////////////////////////////////
        // .DESCRIPTION
        ////////////////////////////////////////////////////////////////////////
        this.module.description = yaml.description || "";
        
        ////////////////////////////////////////////////////////////////////////
        // .VERSION
        ////////////////////////////////////////////////////////////////////////
        if (!semver.valid(yaml.version)) throw new ModuleError(
            `No or invalid version number provided. Reference ` +
            `https://semver.org for more information`,
            ModuleError.type.invalidVersion,
            { version: yaml.version }
        );
        
        ////////////////////////////////////////////////////////////////////////
        // .TARGET
        ////////////////////////////////////////////////////////////////////////
        let target = yaml.target;
        let targetTypes = Object.keys(VSLModule.TargetType);
        if (typeof target === 'undefined') target = 'executable';
        if (targetTypes.indexOf(target) === -1) throw new ModuleError(
            `Target must of be one of: \`${targetTypes.join(", ")}\`.`,
            ModuleError.type.invalidTargetType,
            { type: target }
        );
        
        this.module.target = VSLModule.TargetType[target];
        
        ////////////////////////////////////////////////////////////////////////
        // .NOSTDLIB
        ////////////////////////////////////////////////////////////////////////
        if (typeof yaml.stdlib === 'undefined') yaml.stdlib = true;
        let useStdlib = yaml.stdlib
        this.module.stdlib = useStdlib;
        
        ////////////////////////////////////////////////////////////////////////
        // .SOURCES
        ////////////////////////////////////////////////////////////////////////
        let sources = yaml.sources || [];
        if (!(yaml.sources instanceof Array)) throw new ModuleError(
            `Sources list should be array`,
            ModuleError.type.invalidSourceType
        );
        
        let expandedSources = [];
        for (let i = 0; i < sources.length; i++) {
            let source = sources[i];
            if (typeof source !== 'string') throw new ModuleError(
                `Source #${i} should be string but wasn't.`,
                ModuleError.type.invalidSourceItemType
            );
            
            try {
                let globs = await Module.moduleInterface.glob(
                    sources[i],
                    this.rootPath
                );
                
                expandedSources.push(...globs);
            } catch(e) {
                throw e;
            }
        }
        
        this.module.sources = expandedSources;
    }
    
    /**
     * Loads and process module information. Will throw errors if anything
     * happens.
     *
     * @throws {ModuleError} - See {@link ModuleError} for more information
     */
    async load() {
        // Path to module.yml
        let requestPath = path.join(this.rootPath, 'module.yml');
        this.ymlPath = requestPath;
        
        let ymlString;
        try {
            ymlString = await Module.moduleInterface.readFile(requestPath);
        } catch(error) {
            throw new ModuleError(
                `${this.rootPath} is not a VSL module, could not locate a ` +
                `\`module.yml\``,
                ModuleError.type.moduleNoYml,
                { error }
            )
        }
        
        // Setup moduld
        await this.setupModule(
            yaml.safeLoad(ymlString, {
                filename: requestPath,
                onWarning: ::this.handleWarning,
                schema: yaml.DEFAULT_SAFE_SCHEMA
            })
        )
    }
    
    static moduleInterface = new ModuleInterface();
}
