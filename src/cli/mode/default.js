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

// Returns promise
function prompt(string) {
    return new Promise((resolve, reject) => {
        let rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        rl.question(string, (res) => {
            resolve(res);
            rl.close();
        });
    });
}

export default class Default extends CLIMode {
    usage = "vsl [options] [ -r dir ] [ -c out.ll ] <files> [ -- args ]\nvsl"
    
    constructor() {
        super([
            ["Options", [
                ["-v", "--version"       , "Displays the VSL version",              { run: _ => _.printAndDie(_.version()) }],
                ["-h", "--help"          , "Displays this help message",            { run: _ => _.help() }],
                ["-p", "--repl"          , "Opens an interactive REPL (uses LLIR)", { repl: true }],
                ["-i", "--interactive"   , "Performs interactive compilation",      { interactive: true }],
                ["-I", "--no-interactive", "Performs interactive compilation",      { interactive: false }],
                ["--color"               , "Colorizes all output where applicable", { color: true }],
                ["--no-color"            , "Disables output colorization",          { color: false }],
            ]],
            ["Execution Options", [
                ["-j", "--jit"           , "Performs JIT execution (always uses " +
                                           "LLIR). Spawns an `lli` instance",       { jit: true }],
                ["--backend"             , "Specifies a different backend. This " +
                                           "may be a default backend (LLIR, JS) " +
                                           "or this maybe a custom backend ref.",   { arg: "name" }],
                ["-Wno"                  , "Disables all warnings, also prevents " +
                                           "relevent FIX-ITs from activating",      { warn: false }],
                ["-Wd"                   , "Disables a specific warning by name",   { warn: 2, arg: "name" }]
            ]]
        ]);
        
        this.subcommands = [ "run" ];
        this.fileMap = new Map();
    }
    
    appInfo() {
        return `Subcomamnds: ${this.subcommands.join(", ")}`
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
        
        if (directory) {
            let output = new CompilationStream();
            this.executeModule(directory, output);
        } else if (files.length > 0) {
            this.fromFiles(files);
        } else if (repl) {
            this.launchREPL();
        } else {
            console.log("Cannot read from STDIN as of this moment");
        }
    }
    
    async loadSTL() {
        let stdlibpath = path.join(__dirname, '../../../libraries/libvsl-x');
        let stdlibIndex = await this.executeModule(stdlibpath);
        return new CompilationModule(
            stdlibIndex.root.metadata.name,
            HookType.Strong,
            stdlibIndex
        );
    }
    
    async executeModule(directory, stream) {
        let dirpath = path.resolve(directory);
        
        if (this.fileMap.has(dirpath)) return this.fileMap.get(dirpath);
        // First get the module
        let moduleLoader = new Module(dirpath);
        await moduleLoader.load();
        let module = moduleLoader.module;
        
        let group = new CompilationGroup();
        for (let file of module.sources) {
            let fileStream = group.createStream()
            fileStream.send(await fs.readFile(file));
        }
        
        group.metadata.name = module.name;
        
        let modules = [];
        
        // Hook stdlib if it's enabled
        if (module.stdlib) {
            // We'll rexecute using the cache, what this means is that if
            // there is a cyclic dependency we'll end up with an infinite
            // loop. We stop this so the stdlib doesn't load the stdlib.
            modules.push(await this.loadSTL());
        }
        
        let index = new CompilationIndex(
            group,
            modules
        );
        
        await index.compile(stream);
        this.fileMap.set(dirpath, index);
        
        return index;
    }
    
    async fromFiles(files) {
        let compilationGroup = new CompilationGroup();
        
        for (let i = 0; i < files.length; i++) {
            let data;
            try {
                data = await fs.readFile(files[i], { encoding: 'utf-8' });
            } catch(e) {
                this.error.cli(
                    e.code === 'ENOENT' ?
                    `Could not find file ${file}` :
                    `Could not read file ${file} (${e.code})`
                );
            }
            
            compilationGroup.createStream().send(data);
        }
        
        let index = new CompilationIndex(
            compilationGroup,
            [ await this.loadSTL() ]
        );
        
        await index.compile()
    }
    
    async launchREPL() {
        const setPrompt = (text) => {
            if (!this.color) return;
            return `\u001B[1;${
                colorSupport.has256 ?
                "38;5;202" :
                "31"
            }m${text}\u001B[0m`
        }
        
        let lastCalls = "";
        
        let vsl = setPrompt(`vsl> `);
        let vslCont = setPrompt(`>>>> `);
        
        let stl = await this.loadSTL();
        
        const repl = async () => {
            let group = new CompilationGroup();
            let input = group.createStream();
            
            let inputString = await prompt(vsl);
            
            input.send(lastCalls + inputString);
            input.handleRequest(
                done => prompt(vslCont).then(value => {
                        inputString += '\n' + value;
                        done(value);
                })
            );
            
            let worked = true;
            try {
                await (new CompilationIndex(
                    group,
                    [ stl ]
                )).compile();
                
            } catch(error) {
                worked = false;
                await this.handle(error, lastCalls + inputString, { exit: false });
            }
            
            if (worked) lastCalls += inputString + '\n';
            
            await repl();
        }
        
        await repl();
    }
    
    async handle(error, src, { exit = false } = {}) {
        // console.log(error.node, typeof error.node.position)
        // if (error.node && typeof error.node.position === 'number') {
        //     error.node.position = this.parser.parser.lexer.positions[error.node.position];
        // }
        
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
