import CLIMode from '../CLIMode';

import util from 'util';
import tty from 'tty';

import path from 'path';
import fs from 'fs-extra';

import Toolchain from '../../toolchain/Toolchain';
import DataSourceType from '../../toolchain/DataSourceType';

export default class Default extends CLIMode {
    usage = "vsl [options] <module | files> [ -- args ]\nvsl"

    constructor() {
        super([
            ["Options", [
                ["-v", "--version"       , "Displays the VSL version",               { run: _ => _.printAndDie(_.version()) }],
                ["-h", "--help"          , "Displays this help message",             { run: _ => _.help() }],
                // ["-i", "--interactive"   , "Performs interactive compilation",       { interactive: true }],
                // ["-I", "--no-interactive", "Performs interactive compilation",       { interactive: false }],
                ["--prefix"              , "Outputs the path to the VSL " +
                                           "installation being used. This will " +
                                           "be an absolute path.",                   { run: _ => _.printAndDie(INSTALLATION_PATH) }],
                ["--color"               , "Colorizes all output where applicable",  { color: true }],
                ["--no-color"            , "Disables output colorization",           { color: false }],
            ]],
            ["Execution Options", [
                ["--stl"                 , "Specifies a different standard type " +
                                           "library. The default is libvsl. Otherwise " +
                                           "this chooses the STL from a  module.yml. "+
                                           "This must be a module installed in the " +
                                           "library path.",                          { stl: true, arg: "name" }],
                ["--no-stl"              , "Disables the STL. This can be " +
                                           "overriden with a module.yml",            { nostl: true }],
                ["--backend"             , "Specifies a different backend. This " +
                                           "may be a default backend (LLVM, JS) " +
                                           "or this maybe a custom backend ref. " +
                                           "Case-sensitivity is based on " +
                                           "file-system.",                           { arg: "name" }],
                ["-Wno"                  , "Disables all warnings, also prevents " +
                                           "relevent FIX-ITs from activating",       { warn: false }],
                ["-Wd"                   , "Disables a specific warning by name",    { warn: 2, arg: "name" }]
            ]]
        ]);

        this.subcommands = [ "run" ];
        this.fileMap = new Map();
    }

    appInfo() {
        return `Subcommands: ${this.subcommands.join(", ")} .\n` +
            `Performs JIT execution, use \`vsl build\` to get compiled files.`;
    }

    run(args, subcommands) {
        this.subcommands = subcommands;

        let files = [];
        let directory = null;

        let color       = tty.isatty(1);
        let interactive = tty.isatty(0) && tty.isatty(1);

        let stl = null;

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

        const toolchain = new Toolchain();
        this.error.shouldColor = color;

        if (stl) {
            toolchain.standardLibraryName = stl;
        }

        if (directory) {
            toolchain.compileModule(directory)
                .then(compilationInstance => compilationInstance.compile({
                    emitWarning: (warning) => this.handleWarning(warning)
                }))
                .then(emissionInstance => emissionInstance.interpret())
                .catch(error => this.error.dynamicHandle(error));
        } else if (files.length > 0) {
            const compilationObjects = files.map(filePath => ({
                type: DataSourceType.file,
                data: filePath
            }));

            toolchain.compileFiles(compilationObjects)
                .then(compilationInstance => compilationInstance.compile({
                    emitWarning: (warning) => this.handleWarning(warning)
                }))
                .then(emissionInstance => emissionInstance.interpret())
                .catch(error => this.error.dynamicHandle(error));
        } else if (repl) {
            console.log("REPL is temporarially removed.");
        } else {
            console.log("Cannot read from STDIN as of this moment");
        }
    }

    handleWarning(warning) {
        this.error.dynamicHandle(warning);
    }
}

process.on('unhandledRejection', (reason) => {
    let name = reason.constructor.name;
    let desc = reason.message;

    console.error(`${name}: ${desc}`);
    console.error(util.inspect(reason).replace(/^|\n/g, "\n    "));

    process.exit(1);
});
