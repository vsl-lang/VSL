import path from 'path';
import fs from 'fs-extra';

import CompilationIndex from '../index/CompilationIndex';
import CompilationModule, { HookType } from '../index/CompilationModule';
import CompilationGroup from '../index/CompilationGroup';
import CompilationStream from '../index/CompilationStream';
import CompilationServerClient from '../index/CompilationServerClient';

import DataSourceType from './DataSourceType';
import CompilationInstance from './CompilationInstance';

import Module from '../modules/Module';

/**
 * @typedef {Object} ToolchainInstanceOptions
 * @property {Object} [targetFilter={}] - Key/values specifying which contraints
 *                                      current target satisfies. e.g. `{ arch: 'wasm' }`
 * @property {?Object} [compilationServer=null] - The compilation server to use.
 *                      See {@link CompilationServerClient}'s constructor for
 *                      information on how this parameter's object is formatted.
 * @property {?string} [cacheDirectory=null] - Cache directory. Not valid for
 *                      module executions.
 */

/**
 * @typedef {Object} VSLToolchainDataSource
 * @property {DataSourceType} type - The type of the source
 * @property {string} data - Filename, or string data, whatever it may be.
 */

/**
 * Name of default standard library.
 * @type {String}
 */
export const DEFAULT_STL_NAME = 'libvsl';

/**
 * This class provides methods and instances to manage compiling entire VSL
 * units. While more fine-tuned compilation aspects can be done using
 * {@link CompilationGroup}. This offers a simplified interface over manually
 * managing the complex aspects of compilation such as streams etc.
 *
 * @example
 * const toolchain = new VSLToolchain()
 *
 * // Execute an entire module
 * const { module, index } = this.compileModule('./myvslmodule');
 */
export default class VSLToolchain {
    /**
     * A given instance of the VSLToolchain which keep instances of modules,
     * parser servers etc.
     */
    constructor() {
        /** @private */
        this.directoryModuleAssociations = new Map();

        /** @private */
        this.nativeLibrariesUsed = new Set();

        /** @private */
        this.targetSTLName = DEFAULT_STL_NAME;
    }

    /**
     * Provide a library in the **standard library path** which should be used
     * as the pre-imported standard library.
     *
     * @param {string} libraryName
     * @return {CompilationModule}
     * @async
     */
    set standardLibraryName(stlName) {
        this.targetSTLName = stlName;
    }

    /**
     * Returns the list of native libraries which the compilations so far have
     * specified
     * @type {Set<string>}
     */
    get usedLibraries() {
        return this.nativeLibrariesUsed;
    }

    /**
     * Executes the STL module. Uses the toolchain's STL unless overriden by a
     * module
     * @param {?string} stl - Don't provide to use default.
     * @return {CompilationModule}
     * @async
     */
    async executeSTL(stl) {
        let stlName = typeof stl === 'string' ? stl : this.targetSTLName;
        let stdlibPath = path.join(__dirname, '../../libraries/', stlName);

        let toolchainInstance = await this.compileModule(stdlibPath);
        return new CompilationModule(
            toolchainInstance.index.root.metadata.name,
            HookType.Strong,
            toolchainInstance.index
        );
    }

    /**
     * Executes an entire module. This does not perform the actual emission of
     * bytecode, for that check the compile-* methods
     * @param {string} moduleDirectory - Directory to root of module
     * @param {ToolchainInstanceOptions} [options={}] - Compilation options.
     *                      Uses the default if not provided.
     * @return {CompilationInstance}
     * @async
     */
    async compileModule(moduleDirectory, options = {}) {
        const absoluteModulePath = path.resolve(moduleDirectory);
        if (this.directoryModuleAssociations.has(absoluteModulePath)) {
            return this.directoryModuleAssociations.get(absoluteModulePath);
        }

        let moduleLoader = new Module(absoluteModulePath);
        await moduleLoader.load();
        let module = moduleLoader.module;

        // Add this module's dependencies to the global instance
        for (let i = 0; i < module.linker.libraries.length; i++) {
            this.nativeLibrariesUsed.add(module.linker.libraries[i]);
        }

        // Run bindgens
        for (let i = 0; i < module.bindgens.length; i++) {
            const bindgen = module.bindgens[i];
            await bindgen.dispatch();
        }

        let group = new CompilationGroup();
        const sourcePaths = await module.getSources(options.targetFilter || {});

        if (options.parserServer) {
            group.compilationServer = new CompilationServerClient(options.parserServer);
        }

        group.metadata.name = module.name;
        if (module.cacheDirectory) {
            group.metadata.cacheDirectory = path.join(absoluteModulePath, module.cacheDirectory);
        }

        for (let file of sourcePaths) {
            let fileStream = group.createStream();
            fileStream.sourceName = file;
            fileStream.send(await fs.readFile(file));
        }

        let modules = [];

        // Hook stdlib if it's enabled
        // We'll rexecute using the cache, what this means is that if
        // there is a cyclic dependency we'll end up with an infinite
        // loop. We stop this so the stdlib doesn't load the stdlib.
        if (module.stdlib !== false) {
            modules.push(await this.executeSTL(module.stdlib));
        }

        let index = new CompilationIndex(
            group,
            modules
        );

        await index.compile();
        this.directoryModuleAssociations.set(absoluteModulePath, index);

        return new CompilationInstance(module, index);
    }

    /**
     * Compiles from files instead of a module. Uses the current
     * @param {VSLToolchainDataSource[]} data List of data sources.
     * @param {ToolchainInstanceOptions} [options={}] - Compilation options. If
     *                      not provided the defaults will be used.
     * @return {CompilationInstance}
     * @throws {TypeError} if the provided data source type is invalid.
     * @throws {SystemError} if something like a file read operation fails.
     * @async
     */
    async compileFiles(data, options = {}) {
        let compilationGroup = new CompilationGroup();
        if (options.compilationServer) {
            compilationGroup.compilationServer = new CompilationServerClient(options.compilationServer);
        }

        compilationGroup.metadata.name = '<misc>';
        if (options.cacheDirectory) {
            compilationGroup.metadata.cacheDirectory = options.cacheDirectory;
        }

        for (let i = 0; i < data.length; i++) {
            const dataItem = data[i];

            switch (dataItem.type) {
                case DataSourceType.file: {
                    const filePath = dataItem.data;
                    const fileData = await fs.readFile(filePath, { encoding: 'utf-8' });

                    const stream = compilationGroup.createStream();
                    stream.sourceName = path.resolve(filePath);
                    stream.send(data);
                    break;
                }

                case DataSourceType.data: {
                    const stream = compilationGroup.createStream();
                    stream.sourceName = '<buffer>';
                    stream.send(dataItem.data);
                    break;
                }

                default:
                    throw new TypeError('unknown data type');
            }
        }

        const index = new CompilationIndex(
            compilationGroup,
            [await this.executeSTL()]
        );

        await index.compile();

        return new CompilationInstance(null, index);
    }
}
