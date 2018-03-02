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

import LLVMBackend from '../../vsl/backend/llvm';

import { spawn } from 'child_process';

import prettyPrintPerformance from '../helpers/prettyPrintPerformance'

const INSTALLATION_PATH = path.join(__dirname, '../../..');
const LIBRARY_PATH = path.join(INSTALLATION_PATH, './libraries/');
const DEFAULT_STL = "libvsl";

let interrupt = null;
let rl;

// Returns promise
function prompt(string) {
    return new Promise((resolve, reject) => {
        rl.resume();

        // Handles ANSI colors
        let _setPrompt = rl.setPrompt;
        rl.setPrompt = (prompt) => {
            if (typeof prompt !== 'undefined') {
                _setPrompt.call(rl, prompt, prompt.split(/[\r\n]/).pop().replace(/\u001b.+?m/g, "").length);
            }
        };

        rl.question(string, (res) => {
            resolve(res);
            rl.setPrompt = _setPrompt;
            rl.pause();
        });
    });
}

export default class Default extends CLIMode {
    usage = "vsl [options] <module | files> [ -- args ]\nvsl"

    constructor() {
        rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        super([
            ["Options", [
                ["-v", "--version"       , "Displays the VSL version",               { run: _ => _.printAndDie(_.version()) }],
                ["-h", "--help"          , "Displays this help message",             { run: _ => _.help() }],
                ["-p", "--repl"          , "Opens an interactive REPL (uses LLIR)",  { repl: true }],
                ["-i", "--interactive"   , "Performs interactive compilation",       { interactive: true }],
                ["-I", "--no-interactive", "Performs interactive compilation",       { interactive: false }],
                ["--prefix"              , "Outputs the path to the VSL " +
                                           "installation being used. This will " +
                                           "be an absolute path.",                   { run: _ => _.printAndDie(INSTALLATION_PATH) }],
                ["--color"               , "Colorizes all output where applicable",  { color: true }],
                ["--no-color"            , "Disables output colorization",           { color: false }],
            ]],
            ["Execution Options", [
                ["-j", "--jit"           , "Performs JIT execution (always uses " +
                                           "LLIR). Spawns an `lli` instance",        { jit: true }],
                ["--stl"                 , "Specifies a different standard type " +
                                           "library. The default " +
                                           "is " + DEFAULT_STL + ". Otherwise " +
                                           "this chooses the STL from a " +
                                           "module.yml. This must be a module " +
                                           "installed in the library path.",         { stl: true, arg: "name" }],
                ["--no-stl"              , "Disables the STL. This can be " +
                                           "overriden with a module.yml",            { nostl: true }],
                ["--backend"             , "Specifies a different backend. This " +
                                           "may be a default backend (LLIR, JS) " +
                                           "or this maybe a custom backend ref. " +
                                           "Case-sensitivity is based on " +
                                           "file-system.",                           { arg: "name" }],
                ["-Wno"                  , "Disables all warnings, also prevents " +
                                           "relevent FIX-ITs from activating",       { warn: false }],
                ["-Wd"                   , "Disables a specific warning by name",    { warn: 2, arg: "name" }]
            ]],
            ["Debugging Options", [
                ["--perf-breakdown"      , "Offers performance breakdown on what " +
                                           "parts of transformation time is spent.", { perfBreakdown: true }]
            ]]
        ]);

        this.subcommands = [ "run" ];
        this.fileMap = new Map();
    }

    appInfo() {
        return `Subcommands: ${this.subcommands.join(", ")}\n` +
            `Performs JIT execution, use \`vsl build\` to get compiled files.`;
    }

    run(args, subcommands) {
        this.subcommands = subcommands;

        let jitArgs = [];

        let files = [];
        let directory = null;

        let jit         = false;
        let repl        = tty.isatty(0);
        let color       = tty.isatty(1);
        let interactive = tty.isatty(0) && tty.isatty(1);

        let perfBreakdown = false;

        let stl = DEFAULT_STL;

        for (let i = 0; i < args.length; i++) {
            if (args[i] === "--") {
                jitArgs = args.slice(i + 1);
                break;
            }

            if (args[i][0] === "-" && args[i].length > 1) {
                const flagName = this.allArgs[this.aliases[args[i]] || args[i]];
                if (!flagName) this.error.cli(`unknown flag: ${args[i]}`);

                const flagInfo = flagName[3] || flagName[2];

                if (flagInfo.run) flagInfo.run(this);

                if (flagInfo.jit) jit = flagInfo.jit;
                if (flagInfo.repl) repl = flagInfo.repl;
                if (flagInfo.color) color = flagInfo.color;
                if (flagInfo.interactive) interactive = flagInfo.interactive;
                if (flagInfo.perfBreakdown) perfBreakdown = true;
                if (flagInfo.stl) stl = args[++i];
                if (flagInfo.nostl) stl = false;
            } else {
                // Check if directory file, or neither
                if (!fs.existsSync(args[i])) {
                    this.error.cli(`no such file or directory: \`${args[i]}\``);
                }

                if (directory) {
                    this.error.cli(
                        `already specified directory (\`${directory}\`), ` +
                        `cannot supply more files`
                    );
                }

                if (fs.statSync(args[i]).isDirectory()) {
                    directory = args[i];
                } else {
                    files.push(args[i]);
                }
            }
        }

        this.jit = jit;
        this.color = color;
        this.interactive = interactive;

        this.error.shouldColor = this.color;

        this.stl = stl;

        this.perfBreakdown = perfBreakdown;

        if (directory) {
            let output = this.createStream();
            let backend = new LLVMBackend(output);
            this.executeModule(directory, output, backend)
                .then((index) => {
                    this.postCompilation(index.root);
                    console.log(backend.getByteCode());
                    process.exit(0);
                });
        } else if (files.length > 0) {
            this.fromFiles(files)
                .then((backend) => {
                    let lli = spawn('lli', [], {
                        stdio: ['pipe', 'inherit', 'inherit']
                    });

                    console.log(backend.getByteCode());
                    lli.stdin.write(backend.getByteCode());
                    lli.stdin.end();
                    lli.on('exit', () => {
                        process.exit(0);
                    });
                });
        } else if (repl) {
            this.launchREPL();
        } else {
            console.log("Cannot read from STDIN as of this moment");
        }
    }

    /**
     * Loads the STL and returns it as the only item in an array of compilation
     * modules.
     *
     * @param  {string}  [config=this.stl] The name of the STL to use
     * @return {Promise} Resolves to the copmilation module.
     */
    async loadSTL(config = this.stl) {
        if (config === false) return [];
        let stlName = typeof config === 'string' ? config : DEFAULT_STL;
        let stdlibpath = path.join(__dirname, '../../../libraries/', stlName);
        let stdlibIndex = await this.executeModule(stdlibpath);
        return new CompilationModule(
            stdlibIndex.root.metadata.name,
            HookType.Strong,
            stdlibIndex
        );
    }

    async executeModule(directory, stream, primaryBackend = null) {
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

        return index;
    }

    async fromFiles(files) {
        let compilationGroup = new CompilationGroup();

        // TODO: Don't make data global and use stream to get data.
        let data;
        for (let i = 0; i < files.length; i++) {
            try {
                data = await fs.readFile(files[i], { encoding: 'utf-8' });
            } catch(e) {
                this.error.cli(
                    e.code === 'ENOENT' ?
                    `Could not find file ${files[i]}` :
                    `Could not read file ${files[i]} (${e.code})`
                );
            }

            compilationGroup.createStream().send(data);
        }

        let index = new CompilationIndex(
            compilationGroup,
            [await this.loadSTL()]
        );

        let stream = this.createStream(() => data);
        let backend = new LLVMBackend(stream);
        try {
            await index.compile(backend);
        } catch(error) {
            this.dynamicHandle(error);
        }
        this.postCompilation(compilationGroup);
        return backend;
    }

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

    async launchREPL() {
        const setPrompt = (text) => {
            if (!this.color) return;
            return `\u001B[1;${
                colorSupport.has256 ?
                "38;5;202" :
                "31"
            }m${text}\u001B[0m`;
        }

        let lastCalls = "";

        let vsl = setPrompt(`vsl> `);
        let vslCont = setPrompt(`>>>> `);

        let stl = await this.loadSTL();

        const repl = async () => {
            let group = new CompilationGroup();
            let input = group.createStream();

            let inputString = await prompt(vsl);
            interrupt = null;

            input.send(lastCalls + inputString);
            input.handleRequest(
                done => {
                    interrupt = async () => {
                        rl.close();
                        await repl();
                    }

                    prompt(vslCont).then(value => {
                        inputString += '\n' + value;
                        interrupt = null;
                        done(value);
                    })
                }
            );

            let worked = true;

            // Create index + other execution info.
            let index = new CompilationIndex(group, [stl]);

            let output = this.createStream(() => lastCalls + inputString);
            let backend = new LLVMBackend(output);

            try {
                await index.compile(backend);
            } catch(error) {
                worked = false;
                await this.handle(error, lastCalls + inputString, { exit: false });
            } finally {
                this.postCompilation(group);
                interrupt = null;
            }

            if (worked) {
                console.log(backend.getByteCode());
                lastCalls += inputString + '\n';
            }

            await repl();
        }

        await repl();
    }

    postCompilation(compilationGroup) {
        if (this.perfBreakdown) {
            console.log(prettyPrintPerformance(compilationGroup.context.benchmarks));
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

process.on('beforeExit', () => {
    if (interrupt) {
        interrupt();
    } else {
        process.exit(1)
    };
});
