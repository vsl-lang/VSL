import FixItController from '../../fixit/FixItController';
import FixItCLIColors from '../FixItCLIColors';

import CLIMode from '../CLIMode';

import readline from 'readline';
import colors from 'colors';
import util from 'util';
import tty from 'tty';

import colorSupport from '../colorSupport';

import path from 'path';
import fs from 'fs-extra';

import CompilationIndex from '../../index/CompilationIndex';
import CompilationModule, { HookType } from '../../index/CompilationModule';
import CompilationGroup from '../../index/CompilationGroup';
import CompilationStream from '../../index/CompilationStream';

import Module from '../../modules/Module';
import ModuleError from '../../modules/ModuleError';

import { spawn } from 'child_process';

export const INSTALLATION_PATH = path.join(__dirname, '../../..');
export const LIBRARY_PATH = path.join(INSTALLATION_PATH, './libraries/');
export const DEFAULT_STL = "libvsl";

export default class CompilerCLI extends CLIMode {
    fileMap = new Map();
    linkerArgs = [];

    /**
     * Loads the STL and returns it as the only item in an array of compilation
     * modules.
     *
     * @param  {string} config The name of the STL to use
     * @return {Promise} Resolves to the copmilation module.
     */
    async loadSTL(config) {
        if (config === false) return [];
        let stlName = typeof config === 'string' ? config : DEFAULT_STL;
        let stdlibpath = path.join(__dirname, '../../../libraries/', stlName);
        let { index } = await this.executeModule(stdlibpath);
        return new CompilationModule(
            index.root.metadata.name,
            HookType.Strong,
            index
        );
    }

    /**
     * Executes a module
     * @param {string} directory Path to directory
     * @param {Backend} [primaryBackend=null] If provided, will compile with.
     * @return {Promise} resolves to `{ module, index }`
     */
    async executeModule(directory, primaryBackend = null) {
        let dirpath = path.resolve(directory);

        if (this.fileMap.has(dirpath)) return this.fileMap.get(dirpath);

        // First get the module
        let moduleLoader = new Module(dirpath);
        try {
            await moduleLoader.load();
        } catch(error) {
            if (error instanceof ModuleError) {
                this.error.module(moduleLoader, error);
            } else {
                throw error;
            }
        }

        let module = moduleLoader.module;

        let group = new CompilationGroup();
        for (let file of module.sources) {
            let fileStream = group.createStream();
            fileStream.sourceName = file;
            fileStream.send(await fs.readFile(file));
        }

        group.metadata.name = module.name;

        let modules = [];

        // Hook stdlib if it's enabled
        // We'll rexecute using the cache, what this means is that if
        // there is a cyclic dependency we'll end up with an infinite
        // loop. We stop this so the stdlib doesn't load the stdlib.
        if (module.stdlib !== false) {
            modules.push(await this.loadSTL(module.stdlib));
        }

        let index = new CompilationIndex(
            group,
            modules
        );

        try {
            // Only the primary module should be compiled to a stream
            if (primaryBackend) {
                await index.compile(primaryBackend);
            } else {
                await index.compile();
            }
        } catch(error) {
            this.dynamicHandle(error);
        }

        this.fileMap.set(dirpath, index);

        if (primaryBackend) {
            this.postCompilation(index.root);
        }

        return { index: index, module: module };
    }

    /**
     * Compiles from list of files.
     * @param {string[]} files List of paths
     * @param {Backend} backend - The backend class itself
     * @return {Promise} Returns the {@link CompilationIndex} instanace.
     * @async
     */
    async fromFiles(files, backend) {
        let compilationGroup = new CompilationGroup();

        // TODO: Don't make data global and use stream to get data.
        let data;
        for (let i = 0; i < files.length; i++) {
            // `-` is STDIN
            if (files[i] === '-') {
                const stream = compilationGroup.createStream();

                // Wait until STDIN is ready
                const data = await new Promise((resolve, reject) => {
                    let processedFirstChunk = false,
                        data = Buffer.from([]);
                    process.stdin.on('readable', () => {
                        let chunk;
                        if (null === (chunk = process.stdin.read())) {
                            if (!processedFirstChunk) {
                                this.error.cli(`No readable STDIN`);
                            } else {
                                // All done
                                resolve(data.toString('utf8'));
                            }
                        } else {
                            data = Buffer.concat([data, chunk]);
                            processedFirstChunk = true;
                        }
                    });
                });

                stream.send(data);

            } else {
                try {
                    if (files[i]) {
                        data = await fs.readFile(files[i], { encoding: 'utf-8' });
                    }
                } catch(e) {
                    this.error.cli(
                        e.code === 'ENOENT' ?
                        `Could not find file ${files[i]}` :
                        `Could not read file ${files[i]} (${e.code})`
                    );
                }

                compilationGroup.createStream().send(data);
            }
        }

        let index = new CompilationIndex(
            compilationGroup,
            [await this.loadSTL()]
        );

        backend.stream = this.createStream(() => data);
        try {
            await index.compile(backend);
        } catch(error) {
            this.dynamicHandle(error);
        }

        this.postCompilation(compilationGroup);
        return index;
    }

    /**
     *
     * @abstract
     */
    postCompilation() { return }

    /**
     * Dynamically handles an error by locating stream and obtaining metadata.
     * @param {Error} error any error
     */
    dynamicHandle(error) {
        let stream = null;

        if (error.stream) { stream = error.stream }
        else if (error.node) {
            let trackingNode = error.node;
            do {
                if (trackingNode.stream) {
                    stream = trackingNode.stream;
                    break;
                }
            } while(
                trackingNode.rootScope !== true &&
                (trackingNode = trackingNode.parentScope)
            );
        }

        if (stream) {
            error.stream = stream;
            this.handle(error, stream.data, { exit: true });
        } else {
            throw error;
        }
    }

    /**
     * Creates a {@link CompilationStream} for output
     * @param {Function} srcCallback - Callback to return source.
     * @return {CompilationStream}
     */
    createStream(srcCallback = () => void 0) {
        let stream = new CompilationStream();
        stream.registerWarningListener((warning) => {
            this.warningListener(warning, srcCallback());
        });
        return stream;
    }

    /**
     * Listens for warings to a {@link CompilationStream}. Bind first.
     * @param {BackendWarning} warning warning from backend.
     * @param {string} src - relevant source
     */
    warningListener(warning, src) {
        this.error.handle({
            error: warning,
            src: src,
            exit: false
        });
    }

    /**
     * Handles a VSL error.
     * @param {Error}   error Must be a VSL error
     * @param {string}  src Source as string
     * @param {Object}  data more info about error
     * @param {boolean} data.exit if should exit.
     * @return {Promise} no resolution value.
     */
    async handle(error, src, { exit = false } = {}) {

        let passedExit = exit;
        if (this.interactive) passedExit = false;

        this.error.handle({
            error,
            src,
            passedExit
        })

        if (this.interactive && error.ref) {
            // Do fix it
            let controller = new FixItController(
                async (input) => await prompt(`    ${input}`),
                async (output) => console.log(`    ${output}`)
            );
            controller.colorizer = this.color ? new FixItCLIColors() : null;

            let res = await controller.receive(error, src);
            if (res !== null) {
                await this.feed(res);
            }
        }

        if (exit === true) process.exit(1);
    }
}

process.on('unhandledRejection', (reason) => {
    let name = reason.constructor.name;
    let desc = reason.message;

    console.error(`${name}: ${desc}`);
    console.error(util.inspect(reason).replace(/^|\n/g, "\n    "));

    process.exit(1);
});
