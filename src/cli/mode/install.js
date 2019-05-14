import CLIMode from '../CLIMode';

import readline from 'readline';
import util from 'util';
import tty from 'tty';

import colorSupport from '../colorSupport';

import path from 'path';
import fs from 'fs-extra';

import Module from '../../modules/Module';
import ModuleError from '../../modules/ModuleError';

const INSTALLATION_PATH = path.join(__dirname, '../../..');
const LogType = {
    Info: 0,
    Warning: 1,
    Error: 2
};

export default class Install extends CLIMode {
    usage = "vsl install <module> [options]"

    constructor() {
        super([
            ["Options", [
                ["-h", "--help"          , "Displays this help message",             { run: _ => _.help() }],
                ["-I", "--no-build"      , "Only downloads the module. Does not" +
                                           " run the build steps.",                  { repl: true }],
                ["--color"               , "Enables color.",                         { color: true }],
                ["--no-color"            , "Disables color.",                        { color: false }],
            ]]
        ]);
    }

    appInfo() {
        return (
            `vsl install will download and build a VSL module to the global ` +
            `prefix.`
        );
    }

    run(args, subcommands) {
        let module = null,
            color = tty.isatty(1);

        for (let i = 0; i < args.length; i++) {
            if (args[i][0] === "-" && args[i].length > 1) {
                const flagName = this.allArgs[this.aliases[args[i]] || args[i]];
                if (!flagName) this.error.cli(`unknown flag: ${args[i]}`);

                const flagInfo = flagName[3] || flagName[2];

                if (flagInfo.run) flagInfo.run(this);
                if (flagInfo.color) color = flagInfo.color;
            } else {
                if (module !== null) {
                    this.error.cli(`unexpected argument: ${args[i]}`);
                } else {
                    module = args[i];
                }
            }
        }

        if (module === null) {
            this.error.cli(`no module provided.`);
        }

        this.color = color;
        this.moduleName = module;
        this.runModule(module);
    }

    _color(text, logType) {
        if (this.color === false) return text;
        switch (logType) {
            case LogType.Info: return `\u001B[1;32m${text}\u001B[0m`;
            case LogType.Warning: return `\u001B[1;33m${text}\u001B[0m`;
            case LogType.Error: return `\u001B[1;31m${text}\u001B[0m`;
            default: return text;
        }
    }

    _bold(text) {
        if (this.color === false) return text;
        else return `\u001B[1m${text}\u001B[0m`;
    }

    log(logType, message, title = "install") {
        console.log(
            this._color(`${title}: `, logType) + message
        );
    }

    async runModule(name) {
        this.log(LogType.Info, `Resolving module ${this._bold(this.moduleName)}`);
    }
}
