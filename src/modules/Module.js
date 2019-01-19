import ModuleInterface from './ModuleInterface';
import ModuleError from './ModuleError';
import FilterExpression from './FilterExpression';
import VSLModule from './VSLModule';

import locateBindgen from '../bindgen/locateBindgen';

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
        if (!ModuleInterface.shared.isDirectory(path)) {
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

        if (!/^[A-Za-z_-][A-Za-z_0-9-]*$/.test(yaml.name)) {
            throw new ModuleError(
                `Modules can only have names with letters, dashes, and ` +
                `underscores; numbers for following characters`,
                ModuleError.type.moduleInvalidName,
                { name: yaml.name }
            )
        }

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
        this.module.version = yaml.version;

        ////////////////////////////////////////////////////////////////////////
        // .TARGET
        ////////////////////////////////////////////////////////////////////////
        let target = yaml.target;
        if (typeof target === 'undefined') target = 'native';

        this.module.target = target;

        ////////////////////////////////////////////////////////////////////////
        // .LINKER
        ////////////////////////////////////////////////////////////////////////
        let linker = yaml.linker;
        if (typeof linker === 'undefined') linker = {};

        ////////////////////////////////////////////////////////////////////////
        // .LINKER.LIBRARIES
        ////////////////////////////////////////////////////////////////////////
        let linkerLibraries = linker.libraries;
        if (typeof linkerLibraries === 'undefined') linkerLibraries = [];

        this.module.linker.libraries = linkerLibraries;

        ////////////////////////////////////////////////////////////////////////
        // .CACHE.DIRECTORY
        ////////////////////////////////////////////////////////////////////////
        let cacheDirectory = yaml.cache?.directory;
        if (cacheDirectory) {
            this.module.cacheDirectory = cacheDirectory;
        }

        ////////////////////////////////////////////////////////////////////////
        // .STDLIB
        ////////////////////////////////////////////////////////////////////////
        let yamlValue = yaml.stdlib;
        let stdlib = typeof yamlValue === 'undefined' ? true : yamlValue;
        if (typeof stdlib !== 'string' && typeof stdlib !== 'boolean') {
            throw new ModuleError(
                `STDLIB must be a boolean (if enabled) or a string ` +
                `representing the name of a custom stdlib`,
                ModuleError.type.invalidStdlibSpec,
                { type: stdlib }
            )
        }
        this.module.stdlib = stdlib;

        ////////////////////////////////////////////////////////////////////////
        // .DOCGEN
        ////////////////////////////////////////////////////////////////////////
        let docgenOptions = yaml.docgen ? this.validateDocgen(yaml.docgen) : {};
        this.module.docopts = {
            themeColor: '#09F',
            ...docgenOptions
        };

        ////////////////////////////////////////////////////////////////////////
        // .BINDGEN
        ////////////////////////////////////////////////////////////////////////
        let bindgens = yaml.bindgen || [];
        if (!(bindgens instanceof Array)) throw new ModuleError(
            `Bindgen should be array list`,
            ModuleError.type.invalidSourceType
        );

        for (let i = 0; i < bindgens.length; i++) {
            const bindgen = bindgens[i];

            if (typeof bindgen.language !== 'string') throw new ModuleError(
                `Bindgen at index ${i} must have \`language\` parameter of type string`
            );

            if (!(bindgen.sources instanceof Array)) throw new ModuleError(
                `Bindgen at index ${i} must have array of \`sources\``
            );


            const bindgenSources = [];
            for (let j = 0; j < bindgen.sources.length; j++) {
                if (typeof bindgen.sources[j] !== 'string') throw new ModuleError(
                    `Bindgen at index ${i} and source at index ${j} must be a ` +
                    `glob of type string.`
                );

                const files = await ModuleInterface.shared.glob(
                    bindgen.sources[j],
                    this.rootPath
                );

                bindgenSources.push(...files);
            }

            if (typeof bindgen.output !== 'object') throw new ModuleError(
                `Bindgen at index ${i} must have \`output\` object.`
            );

            if (typeof bindgen.output.name !== 'string') throw new ModuleError(
                `Bindgen at index ${i} must have \`output.name\` string.`
            );

            if (typeof bindgen.output.directory !== 'string') throw new ModuleError(
                `Bindgen at index ${i} must have \`output.directory\` string.`
            );

            const bindgenInstance = locateBindgen(
                bindgen.language,
                bindgenSources,
                {
                    outputDirectory: path.join(this.rootPath, bindgen.output.directory),
                    outputName: bindgen.output.name
                }
            );

            if (!bindgenInstance) {
                throw new ModuleError(
                    `No bindgen named ${bindgen.name}.`
                );
            }

            this.module.bindgens.push(bindgenInstance);
        }

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
            let sourceGlob = null;
            let sourceFilterExpression = null;


            if (typeof source === 'string') {
                sourceGlob = source;
                sourceFilterExpression = FilterExpression.all;
            } else if (typeof source === 'object') {
                if (typeof source.path !== 'string') {
                    throw new ModuleError(
                        `Source #${i} needs 'path' param to be string.`,
                        ModuleError.type.invalidSourceItemType
                    );
                }

                if ('filters' in source) {
                    if (!(source.filters instanceof Array)) {
                        throw new ModuleError(
                            `Source #${i} needs 'filter' param to be array.`,
                            ModuleError.type.invalidSourceItemType
                        );
                    }

                    sourceFilterExpression = FilterExpression.none;

                    for (const filter of source.filters) {
                        const params = Object.entries(filter)
                            .map(([key, value]) => ({
                                modifier: key.startsWith('not.') ? 'not' : null,
                                key: key.replace(/^not\./i, ''),
                                value: value
                            }));


                        const expression = new FilterExpression(params);
                        sourceFilterExpression.append(expression);
                    }
                } else {
                    sourceFilterExpression = FilterExpression.all;
                }

                sourceGlob = source.path;
            } else {
                throw new ModuleError(
                    `Source #${i} should be string but wasn't.`,
                    ModuleError.type.invalidSourceItemType
                );
            }

            expandedSources.push([sourceGlob, sourceFilterExpression]);
        }

        this.module._sources = expandedSources;
    }

    /**
     * Validates docgen options
     * @param {Object} options
     * @return {Object} same object.
     * @throws {ModuleError}
     */
    validateDocgen(options) {
        if (options.themeColor && !this.validateColor(options.themeColor)) {
            throw new ModuleError(
                `Module theme color must be a valid color (6-digit hex code.)`,
                ModuleError.type.invalidDocgenConfig
            );
        }

        return options;
    }

    /**
     * Validates color
     * @param {string} color
     * @return {boolean}
     */
    validateColor(color) {
        return /^#[0-9a-f]{6}/i.test(color);
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
        this.module.rootPath = this.rootPath;

        let ymlString;
        try {
            ymlString = await ModuleInterface.shared.readFile(requestPath);
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
}
