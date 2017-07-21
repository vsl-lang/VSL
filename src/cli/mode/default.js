import ParserError from '../../vsl/parser/parserError';
import VSLParser from '../../vsl/parser/vslparser';
import VSLTransform from '../../vsl/transform/transform';
import VSLTokenizer from '../../vsl/parser/vsltokenizer';

import FixItController from '../../fixit/FixItController';
import FixItCLIColors from '../FixItCLIColors';

import CLIMode from '../CLIMode';

import readline from 'readline';
import colors from 'colors';
import util from 'util';
import tty from 'tty';

import path from 'path';
import fs from 'fs-extra';

import CompilationIndex from '../../index/CompilationIndex';
import CompilationModule, { HookType } from '../../index/CompilationModule';
import CompilationGroup from '../../index/CompilationGroup';
import CompilationStream from '../../index/CompilationStream';

import Module from '../../modules/Module';

export default class Default extends CLIMode {
    usage = "vsl [options] [ -r dir ] [ -c out.ll ] <files> [ -- args ]\nvsl"
    
    constructor() {
        super([
            ["Options", [
                ["-v", "--version"       , "Displays the VSL version",              { run: _ => _.printAndDie(_.version()) }],
                ["-h", "--help"          , "Displays this help message",            { run: _ => _.help() }],
                ["-p", "--repl"          , "Opens an interactive REPL",             { repl: true }],
                ["-i", "--interactive"   , "Performs interactive compilation",      { interactive: true }],
                ["-I", "--no-interactive", "Performs interactive compilation",      { interactive: false }],
                ["--color"               , "Colorizes all output where applicable", { color: true }],
                ["--no-color"            , "Disables output colorization",          { color: false }],
            ]],
            ["Debug Flags", [
                ["-n", "--dry-run", "Checks the VSL code but does not compile or run",       { mode: "dryRun" }],
            ]],
            ["Source Debugging Flags", [
                ["-dregen", "--dry-run-gen", "Performs a dry-run but outputs the generated AST code", { mode: "dryRunGen" }],
                ["-dscope", "--debug-scope", "Generates and outputs the scope tree",                  { mode: "scope" }],
                ["-dast"  , "--debug-ast"  , "Sets the context mode to an AST printer.",              { mode: "ast" }],
                ["-dlex"  , "--debug-lexer", "Sets the context mode to the tokenizer output.",        { mode: "lex" }]
            ]]
        ]);
        
        this.parser = new VSLParser();
        
        this.persistentScope = false;
        
        this.previousScope = null;
        this.previousContext = undefined;
        
        this.pendingString = "";
        
        this.repl = readline.createInterface(process.stdin, process.stdout);
        
        this.subcommands = [ "run" ];
    }
    
    appInfo() {
        return `Subcomamnds: ${this.subcommands.join(", ")}`
    }
    
    run(args, subcommands) {
        this.subcommands = subcommands;
        
        if (args.length === 0) {
            this.executeDirectory('.');
            return;
        }
        
        let procArgs = [];
        let files = [];
        let mode = "";
        let repl = tty.isatty(0);
        let color = tty.isatty(0);
        let interactive = tty.isatty(0);
        
        for (let i = 0; i < args.length; i++) {
            if (args[i] === "--") {
                procArgs = args.slice(i + 1);
                break;
            }
            
            if (args[i][0] === "-") {
                const flagName = this.allArgs[this.aliases[args[i]] || args[i]];
                if (!flagName) this.error.cli(`unknown flag: ${args[i]}`);
                
                const flagInfo = flagName[3] || flagName[2];
                
                if (flagInfo.run) flagInfo.run(this);
                if (flagInfo.mode) mode = flagInfo.mode;
                if (flagInfo.repl) repl = flagInfo.repl;
                if (flagInfo.color) color = flagInfo.color;
                if (flagInfo.interactive) interactive = flagInfo.interactive;
            } else {
                files.push(args[i]);
            }
        }
        
        // Determine whether to launch repl or not
        this.mode = mode;
        this.color = color;
        this.interactive = interactive;
        
        this.error.shouldColor = this.color;
        
        if (files.length > 0) {
            this.fromFiles(files);
        } else if (repl) {
            this.launchREPL();
        } else {
            process.stdin.resume();
            process.stdin.setEncoding('utf8');
            process.stdin.on('data', (data) => {
                if (data) {
                    this.pendingString += data;
                    this.feed(data);
                }
            });
        }
    }
    
    async executeDirectory(directory) {
        let stdlibpath = path.join(__dirname, '../../../libraries/libvsl-x');
        let fileMap = new Map(); // <moduleRoot, value>
        
        async function execute(directory) {
            let dirpath = path.resolve(directory);
            
            if (fileMap.has(dirpath)) return fileMap.get(dirpath);
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
                let stdlibIndex = await execute(stdlibpath);
                modules.push(new CompilationModule(
                    stdlibIndex.root.metadata.name,
                    HookType.Strong,
                    stdlibIndex
                ));
            }
            
            let index = new CompilationIndex(
                group,
                modules
            );
            
            await index.compile();
            fileMap.set(dirpath, index);
            return index;
        }
        
        let res = await execute(directory);
        this.repl.close();
    }
    
    async fromFiles(files) {
        let compilationGroup = new CompilationGroup();
        for (let i = 0; i < files.length; i++) {
            let stream = compilationGroup.createStream();
            
            let data;
            try {
                data = await fs.readFile(files[i], { encoding: 'utf-8' });
            } catch(e) {
                if (e.code === 'ENOENT') {
                    this.error.cli(`Could not find file ${file}`);
                } else {
                    this.error.cli(`Could not read file ${file} (${e.code})`);
                }
            }
            
            stream.send(data);
        }
        
        let res = compilationGroup.compile();
        
        this.repl.close();
    }
    
    async _parse(string, { file, exit = false } = {}) {
        if (this.pendingString === "") {
            this.parser = new VSLParser();
        }
        
        this.pendingString += string;
        try {
            let ast = await this.parser.feed(string);
            if (ast.length === 0) {
                return false;
            } else {
                let res = { str: this.pendingString.slice(), ast: ast }
                this.pendingString = "";
                return res;
            }
        } catch(e) {
            this.handle(e, this.pendingString, { file, exit });
            this.pendingString = "";
            return null;
        }
    }
    
    setRed(text) {
        if (!this.color) return;
        return `\u001B[1;${
            process.env.TERM.indexOf("256") > -1 ?
            "38;5;202" :
            "31"
        }m${text}\u001B[0m`
    }
    
    launchREPL() {
        this.persistentScope = true;
        const REPL = this.repl;
        
        // Fix ANSI color bug
        REPL._setPrompt = REPL.setPrompt;
        REPL.setPrompt = (prompt, length) =>
            REPL._setPrompt(prompt, length ? length : prompt.split(/[\r\n]/).pop().stripColors.length);
        
        let rawPrompt = `vsl${this.mode ? `::${this.mode}` : ""}> `
        let prompt = this.setRed(rawPrompt);
        let unfinishedPrompt = ">".repeat(rawPrompt.length - 1) + " ";
        REPL.setPrompt(prompt);
        
        let unfinished = false;
        REPL.on('line', async (input) => {
            let res = await this.feed(input);
            
            if (res === false) {
                unfinished = false;
                REPL.setPrompt(unfinishedPrompt);
            } else {
                REPL.setPrompt(prompt);
            }
            
            REPL.prompt();
        });
        
        REPL.on('close', () => {
            console.log();
            if (unfinished) {
                REPL.setPrompt(unfinishedPrompt);
                unfinished = false;
                return REPL.prompt();
            }
            REPL.close();
        })
        
        REPL.prompt();
        process.stdin.resume();
    }
    
    async handle(error, src, { exit = false } = {}) {
        // console.log(error.node, typeof error.node.position)
        if (error.node && typeof error.node.position === 'number') {
            error.node.position = this.parser.parser.lexer.positions[error.node.position];
        }
        
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
                (input) => new Promise((resolve, reject) => {
                    this.repl.question(`    ${input}`, (res, error) => {
                        error ? reject(error) : resolve(res)
                    })
                }),
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
    
    async feed(string) {
        const modeFunc = this.getMode(this.mode, () => string);
        if (modeFunc === false) return;
        
        let res = await this._parse(string);
        if (res === false) return false;
        if (res === null) return;
        
        try {
            let ast = res.ast;
            modeFunc(ast);
        } catch(e) {
            await this.handle(e, res.str);
        }
    }
    
    getMode(mode, string) {
        const modes = {
            
            "lex": (_, { input }) => {
                let tokenizer = new VSLTokenizer();
                console.log(util.inspect(tokenizer.tokenize(input), {
                    colors: this.color,
                    showHidden: true,
                    depth: null
                }));
            },
            
            "ast": (ast) => {
                console.log(util.inspect(ast, {
                    colors: this.color,
                    showHidden: true,
                    depth: null
                }));
            },
            
            "scope": (ast) => {
                if (this.persistentScope) ast[0].scope.parentScope = this.previousScope;
                this.previousScope = ast[0].scope;
                
                this.previousContext = VSLTransform(ast, this.previousContext);
                console.log(ast[0].scope.toString());
            },
            
            "dryRunGen": (ast) => {
                if (this.persistentScope) ast[0].scope.parentScope = this.previousScope;
                this.previousScope = ast[0].scope;
                
                this.previousContext = VSLTransform(ast, this.previousContext);
                console.log(ast[0].toString());
            }
            
        };
        
        let m = modes[mode];
        if (!m) this.error.cli(`Unhandled mode ${this.mode} (internal)`);
        if (m.length > 1) {
            m(null, { input: string() });
            return false;
        }
        return m;
    }
}

process.on('unhandledRejection', (reason) => {
    console.log("INTERNAL BORK ALERT");
    console.log(reason);
    process.exit(1);
});
