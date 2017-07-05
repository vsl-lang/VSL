import ParserError from '../../vsl/parser/parserError';
import VSLParser from '../../vsl/parser/vslparser';
import VSLTransform from '../../vsl/transform/transform';
import VSLTokenizer from '../../vsl/parser/vsltokenizer';

import FixItController from '../../fixit/FixItController';

import CLIMode from '../CLIMode';

import readline from 'readline';
import colors from 'colors';
import util from 'util';
import tty from 'tty';

import fs from 'fs-extra';

export default class Default extends CLIMode {
    usage = "vsl [options] [ -r dir ] [ -c out.ll ] <files> [ -- args ]"
    
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
    
    async fromFiles(files) {
        
        // Get the mode, we'll call this once per AST
        // TODO: actual binding
        let mode = this.getMode(this.mode, () => fs.readFileSync(files[0], 'utf-8'));
        if (mode === false) return;
        
        let astPromises = new Array(files.length);
        let fileSources = new Array(files.length);
        
        for (let [index, file] of files.entries()) {
            let contents;
            try {
                contents = await fs.readFile(file, {
                    encoding: 'utf-8'
                });
                fileSources[index] = contents;
            } catch(e) {
                // Bork Alert
                if (e.code === 'ENOENT') {
                    this.error.cli(`Could not find file ${file}`);
                } else {
                    this.error.cli(`Could not read file ${file} (${e.code})`);
                }
            }
            
            astPromises[index] = new Promise(async (resolve, reject) => {
                let res = await this._parse(contents, { file, exit: true })
                if (res === false) {
                    let lines = file.split("\n");
                    this.handle(
                        new ParserError(
                            `Unexpected EOF. Perhaps you forgot a closing bracket?`,
                            {
                                line: lines.length - 1,
                                column: lines[lines.length - 1].length - 1,
                                index:file.length - 1,
                                length: 1
                            }
                        ),
                        file,
                        { file, exit: true }
                    );
                }
                
                resolve(res.ast);
            });
        }
        
        // List of ours ASTs
        let asts;
        try {
            asts = await Promise.all(astPromises);
        } catch(e) {
            throw e;
        }
        
        for (let i = 0; i < asts.length; i++) {
            try {
                mode(asts[i]);
            } catch(e) {
                await this.handle(e, fileSources[i]);
            }
        }
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
    
    launchREPL() {
        this.persistentScope = true;
        const REPL = this.repl;
        
        // Fix ANSI color bug
        REPL._setPrompt = REPL.setPrompt;
        REPL.setPrompt = (prompt, length) =>
            REPL._setPrompt(prompt, length ? length : prompt.split(/[\r\n]/).pop().stripColors.length);
        
        let rawPrompt = `vsl${this.mode ? `::${this.mode}` : ""}> `
        let prompt = this.color ? rawPrompt.red.bold : rawPrompt;
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
            controller.shouldColor = this.color;
            
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

process.on('unhandledRejection', (reason, error) => {
    console.log("INTERNAL BORK ALERT");
    console.log(reason);
    console.log(error);
});
