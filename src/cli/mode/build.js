import CompilerCLI, { DEFAULT_STL } from '../helpers/CompilerCLI';
import TempFileManager from '../helpers/TempFileManager';
import path from 'path';
import fs from 'fs-extra';
import tty from 'tty';

import hrtime from 'browser-process-hrtime';

import { spawn } from 'child_process';

import LLVMBackend, { Targets } from '../../vsl/backend/llvm';
import WASMIndex from '../../../wasm/index.json';
import prettyPrintPerformance from '../helpers/prettyPrintPerformance'
import findCRT from '../helpers/findCRT';

const WASMIndexRoot = path.relative(process.cwd(), path.join(__dirname, '../../../wasm'));

export default class Build extends CompilerCLI {
    usage = "vsl build [options] <module | files> -o <out file>\nvsl build info <target>"

    constructor() {
        super([
            ["Options", [
                ["-h", "--help"          , "Displays this help message",             { run: _ => _.help() }],
                ["--targets"             , "Lists supported compilation targets " +
                                           "for more compile to LLVM `.bc`",         { run: _ => _.listTargets() }],
                ["--color"               , "Colorizes all output where applicable",  { color: true }],
                ["--no-color"            , "Disables output colorization",           { color: false }],
            ]],
            ["Build Options", [
                ["-o"                    , "Required. Specifies output file. Use" +
                                           "`-` for STDOUT.",                        { arg: "file", output: true }],
                ["-O"                    , "Optimization level, default is 2." +
                                           "Values are [0, 3], 3 being most " +
                                           "optimized.",                             { arg: "opt", opt: true }],
                ["--library", "-l",      , "Specifies a C library to link with",     { arg: "library", library: true }],
                ["--linker"              , "Specifies the linker. ",                 { arg: "linker", linker: true  }],
                ["-Xl"                   , "Specifies an extra linker argument",     { arg: "arg", xlinker: true }],
                ["-Xllc"                 , "Specifies an argument to LLC.",          { arg: "arg", xllc: true }],
                ["-S", "--no-build"      , "Prevents assembly and linkage, " +
                                           "outputs `.ll`",                          { link: false }],
                ["-t", "--target"        , "Compilation target. To see all " +
                                           "targets, use \`vsl build --targets\`",   { arg: "target", target: true }],
                ["-T", "--triple"        , "The target triple to use for " +
                                           "compilation. ",                          { arg: "triple", triple: true }]
            ]],
            ["Compiler Options", [
                ["--stl"                 , "Specifies a different standard type " +
                                           "library. The default " +
                                           "is " + DEFAULT_STL + ". Otherwise " +
                                           "this chooses the STL from a " +
                                           "module.yml. This must be a module " +
                                           "installed in the library path.",         { stl: true, arg: "name" }],
                ["--no-stl"              , "Disables the STL. This can be " +
                                           "overriden with a module.yml",            { nostl: true }],
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
    }

    appInfo() {
        return `Toolchain for compiling VSL files.`;
    }

    listTargets() {
        let targetText = 'Directly supported VSL targets:\n\n';

        for (let [target] of Targets) {
            targetText += `  - ${target}\n`;
        }

        targetText += '\nFor more, compile to LLVM IR using `-S` and use ' +
            '`llc` or use --triple with `native`';
        this.printAndDie(targetText);
    }

    run(args) {
        if (args[0] === 'info') {
            if (!args[1]) this.error.cli(`provide target to get info on`);
            this.getInfo(args[1]);
        }

        let color = tty.isatty(1);
        let perfBreakdown = false;
        let stl = DEFAULT_STL;
        let link = true;
        let target = 'native';
        let triple = undefined;

        let linker = 'ld';
        let linkerArgs = [];
        let llcArgs = [];
        let libraries = [];

        let directory = null;
        let files = [];
        let outputStream = null;
        let opt = 2; // Optimization level

        if (args.length === 0) {
            this.help();
        }
        for (let i = 0; i < args.length; i++) {
            if (args[i][0] === "-" && args[i].length > 1) {
                const flagName = this.allArgs[this.aliases[args[i]] || args[i]];
                if (!flagName) this.error.cli(`unknown flag: ${args[i]}`);

                const flagInfo = flagName[3] || flagName[2];

                if (flagInfo.run) flagInfo.run(this);

                if ('color' in flagInfo) color = flagInfo.color;
                if ('link' in flagInfo) link = flagInfo.link;
                if ('linker' in flagInfo) linker = flagInfo.linker;
                if ('nostl' in flagInfo) stl = false;
                if ('perfBreakdown' in flagInfo) perfBreakdown = true;
                if ('library' in flagInfo) libraries.push(`-l${args[++i]}`);
                if ('xllc' in flagInfo) llcArgs.push(args[++i]);
                if ('xlinker' in flagInfo) linkerArgs.push(args[++i]);
                if ('stl' in flagInfo) stl = args[++i];
                if ('opt' in flagInfo) opt = args[++i];
                if ('target' in flagInfo) target = args[++i];
                if ('triple' in flagInfo) triple = args[++i];
                if (flagInfo.output) {
                    let path = args[++i];
                    if (outputStream) {
                        this.error.cli(`Already provided an output.`);
                    } else  if (path === '-') {
                        outputStream = process.stdout;
                    } else {
                        outputStream = fs.createWriteStream(path);
                    }
                }
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

        this.color = color;
        this.error.shouldColor = this.color;
        this.stl = stl;
        this.link = link;
        this.perfBreakdown = perfBreakdown;
        this.triple = triple;

        this.linker = linker;
        this.libraries = libraries;
        this.linkerArgs = linkerArgs;
        this.llcArgs = llcArgs;

        this.outputStream = outputStream;

        if (![0, 1, 2, 3].includes(+opt)) {
            this.error.cli(`invalid optimization level ${opt}`);
        }
        this.optimizationLevel = opt;


        if (this.outputStream === null) {
            this.error.cli(`Provide output location.`);
        }

        this.setTarget(target);

        let backend = new LLVMBackend(this.createStream(), this.triple);
        if (directory) {
            this.executeModule(directory, backend)
                .then(({ module }) => {
                    if (module.target) this.setTarget(module.target);
                    this.compileLLVM(backend);
                });
        } else if (files.length > 0) {
            this.fromFiles(files, backend)
                .then((index) => {
                    this.compileLLVM(backend);
                });
        } else {
            this.help();
        }
    }

    /**
     * Returns the target triple
     * @type {string}
     */
    get triple() {
        return this._triple || this.target.triple;
    }

    _triple = null;
    /**
     * If we explicitly overide the triple
     * @type {string}
     */
    set triple(triple) {
        this._triple = triple;
    }

    /**
     * Sets the target
     * @param {string} target
     */
    setTarget(target) {
        let targetData = Targets.get(target);
        if (!targetData) this.error.cli(`unknown target ${target} see \`vsl build --targets\``);
        else this.target = targetData;
    }

    /**
     * Prints info on target
     * @param {string} target
     */
    getInfo(target) {
        let targetData = Targets.get(target);
        if (!targetData) this.error.cli(`unknown target ${target}`);
        this.printAndDie(
            `\u001B[1m${target}:\u001B[0m ` + targetData.info +
                '\n Default Triple: ' + targetData.triple
        )
    }

    /**
     * Finishes LLVM compilation
     * @param {Backend} backend backend
     */
    async compileLLVM(backend) {
        let start = hrtime();
        if (this.link === false) {
            // Just write bytecode
            this.outputStream.write(backend.getByteCode());
        } else {
            // Otherwise compile to
            const fileManager = new TempFileManager();
            const byteCode = backend.getByteCode();

            let asmFile = fileManager.tempWithExtension('o');

            await this.llc(byteCode, asmFile, {
                triple: this.target.triple,
                type: this.target.type,
                optLevel: this.optimizationLevel
            });

            this._colorCompilationStep(`<input.ll>`, asmFile);

            switch (this.target.command) {
                case "ld":

                    // Try to find CRT
                    let crt = await findCRT();
                    if (crt === null) {
                        this.error.cli(
                            `failed: could not locate crt. See https://git.io/vslerr#crt-not-found for more information.`
                        );
                    }

                    let outFile = fileManager.tempWithExtension('out');
                    await this.ld(asmFile, outFile, {
                        outputType: [crt]
                    });
                    this._colorCompilationStep(asmFile, outFile);

                    let readStream = fs.createReadStream(outFile);
                    readStream.pipe(this.outputStream);
                    this._colorCompilationStep(outFile, '<output>');

                    break;
                case "obj":
                    let asmStream = fs.createReadStream(asmFile);
                    asmStream.pipe(this.outputStream);
                    this._colorCompilationStep(asmFile, '<output>');
                    break;
                case "wasm":
                    let wastFile = fileManager.tempWithExtension('wast');
                    await this.s2wasm(asmFile, fs.createWriteStream(wastFile));
                    this._colorCompilationStep(asmFile, wastFile)

                    let wasmFile = fileManager.tempWithExtension('wasm');
                    await this.wasmMerge([
                        wastFile
                    ].concat(
                        WASMIndex.map(file => path.join(WASMIndexRoot, file))
                    ), wasmFile);
                    this._colorCompilationStep(wastFile, wasmFile);

                    let wasmStream = fs.createReadStream(wasmFile);
                    wasmStream.pipe(this.outputStream);
                    this._colorCompilationStep(wasmFile, '<output>');

                    break;
                default:
                    this.error.cli(`target compiles with unknown step ${this.command}.`);
            }
        }

        let elapsed = hrtime(start);
        let timeInMs = (elapsed[0] * 1e3 + elapsed[1] / 1e6).toFixed(2);
        if (this.color) {
            console.log(`\n\u001B[1;32mSuccesfully compiled in ${timeInMs}ms\u001B[0m`);
        } else {
            console.log(`\nSuccesfully compiled in ${timeInMs}ms`);
        }
    }

    /**
     * Assembles WASM. Converts .WASTs to one .WASM
     * @param {string[]} file the input file
     * @param {string} outfile the output file
     * @return {Promise}
     */
    async wasmMerge(files, outfile) {
        return new Promise((resolve, reject) => {
            let wasmMerge = spawn('wasm-merge', files.concat([
                '-o', outfile
            ]), {
                stdio: ['ignore', 'inherit', 'inherit']
            });

            wasmMerge.on('error', (error) => {
                switch (error.code) {
                    case "ENOENT":
                        this.error.cli(`failed: could not locate wasm-merge binary. Ensure Binaryen (https://git.io/binaryen) is installed.`);
                    default:
                        this.error.cli(`failed: ${error.message} (${error.code})`);
                }
            });

            wasmMerge.on('exit', (errorCode) => {
                if (errorCode === 0) {
                    resolve();
                } else {
                    this.error.cli(`failed: wasm-merge: exited with ${errorCode}`);
                }
            })
        });
    }

    /**
     * Compiles LLVM `.s` files with WASM target to WAST files.
     * @param {string} file source file input
     * @param {WritableStream} outstream output stream of wast file
     * @return {Promise} resolves when finished
     */
    async s2wasm(file, outstream) {
        return new Promise((resolve, reject) => {
            // Spawn LLC compiler. Pass target option
            let s2wasm = spawn('s2wasm', [ file ], {
                stdio: ['ignore', 'pipe', 'pipe']
            });

            s2wasm.on('error', (error) => {
                switch (error.code) {
                    case "ENOENT":
                        this.error.cli(`failed: could not locate s2wasm binary. Ensure Binaryen (https://git.io/binaryen) is installed.`);
                    default:
                        this.error.cli(`failed: ${error.message} (${error.code})`);
                }
            });

            s2wasm.stdout.pipe(outstream);

            s2wasm.on('exit', (errorCode) => {
                if (errorCode === 0) {
                    resolve();
                } else {
                    this.error.cli(`failed: s2wasm: exited with ${errorCode}`);
                }
            })
        });
    }

    /**
     * Attempts to link source `.o` together with libraries etc.
     * @param {string} sourceFile the input object file
     * @param {string} outputFile the output binary
     * @param {Object} linkerOptions additional linker options
     * @param {string[]} outputType default is `-e _main` outputting executable.
     * @return {Promise} Resolves when finished
     */
    async ld(sourceFile, outputFile, { outputType = [] } = {}) {
        return new Promise((resolve, reject) => {
            let ld = spawn(this.linker, [
                sourceFile,
                '-lc',
                '-o', outputFile
            ].concat(outputType, this.linkerArgs, this.libraries), {
                stdio: ['ignore', 'inherit', 'inherit']
            });

            ld.on('error', (error) => {
                switch (error.code) {
                    case "ENOENT":
                        this.error.cli(`failed: could not locate linker \`(${this.linker})\`.`);
                    default:
                        this.error.cli(`failed: ${error.message} (${error.code})`);
                }
            });

            ld.on('exit', (errorCode) => {
                if (errorCode === 0) {
                    resolve();
                } else {
                    this.error.cli(`failed: ld: exited with ${errorCode}`);
                }
            })
        });
    }

    /**
     * Compiles using LLC
     * @param {string} byteCode byte code from llvm
     * @param {string} outputFile output .s file.
     * @param {Object} compilationOptions other compilation options
     * @param {string} compilationOptions.triple Target triple
     * @param {string} compilationOptions.optLevel 0-3
     * @return {Promise} If succesful. output file is `.s` with correct infno.
     */
    llc(byteCode, outputFile, {
        triple = "",
        type = "obj",
        optLevel = "2"
    } = {}) {
        return new Promise((resolve, reject) => {
            // Spawn LLC compiler. Pass target option
            let llc = spawn('llc', [
                `-mtriple=${triple}`,
                `-O=${optLevel}`,
                `-filetype=${type}`,
                `-o=${outputFile}`
            ].concat(this.llcArgs), {
                stdio: ['pipe', 'inherit', 'inherit']
            });

            llc.on('error', (error) => {
                switch (error.code) {
                    case "ENOENT":
                        this.error.cli(`failed: could not locate llc binary.`);
                    default:
                        this.error.cli(`failed: ${error.message} (${error.code})`);
                }
            });

            let didWriteBC = llc.stdin.write(byteCode);
            if (didWriteBC) {
                llc.stdin.end();
            } else {
                llc.stdin.on('drain', () => {
                    llc.stdin.end();
                })
            }

            llc.on('exit', (errorCode) => {
                if (errorCode === 0) {
                    resolve();
                } else {
                    this.error.cli(`failed: llc: exited with ${errorCode}`);
                }
            })
        });
    }

    _lastCompColor = 0
    _colorCompilationStep(from, to) {
        let str, lastColor = this._lastCompColor;

        let colors = ['1', '1;33', '1;32', '1;34', '1;35']
        let oldColor = colors[this._lastCompColor % colors.length];
        let nextColor = colors[++this._lastCompColor % colors.length];

        if (this.color) {
            str = `\u001B[${oldColor}m${from}\u001B[0m -> \u001B[${nextColor}m${to}\u001B[0m`;
        } else {
            str = `${from} -> ${to}`;
        }
        console.log(str);
    }

    postCompilation(compilationGroup) {
        if (this.perfBreakdown) {
            console.log(prettyPrintPerformance(compilationGroup.context.benchmarks));
        }
    }

}
