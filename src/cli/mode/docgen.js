import CompilerCLI from '../helpers/CompilerCLI';
import TempFileManager from '../helpers/TempFileManager';
import path from 'path';
import fs from 'fs-extra';

import DocGen from '../../docgen/DocGen';

export default class Doxgen extends CompilerCLI {
    usage = "vsl docgen [options] <module> -o <out dir>"

    constructor() {
        super([
            ["Options", [
                ["-h", "--help"          , "Displays this help message",             { run: _ => _.help() }],
                ["--verbose"             , "Prints a little bit of debug info",      { verbose: true }]
            ]],
            ["Output Options", [
                ["-o"                    , "The output directory of doc files ",     { output: true }]
            ]]
        ]);
    }

    appInfo() {
        return `VSL documentation generator.`;
    }

    run(args) {
        let verbose = false;
        let directory = null;

        let outputDirectory = null;

        if (args.length === 0) {
            this.help();
        }

        for (let i = 0; i < args.length; i++) {
            if (args[i][0] === "-" && args[i].length > 1) {
                const flagName = this.allArgs[this.aliases[args[i]] || args[i]];
                if (!flagName) this.error.cli(`unknown flag: ${args[i]}`);

                const flagInfo = flagName[3] || flagName[2];

                if (flagInfo.run) flagInfo.run(this);

                if ('output' in flagInfo) {
                    if (outputDirectory) this.error.cli(`multiple output directories.`);
                    outputDirectory = args[++i];
                }
                if ('verbose' in flagInfo) verbose = true;
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
                    this.error.cli(
                        `Can only run documentation generator on a module.`
                    );
                }
            }
        }

        if (!directory) {
            this.error.cli(`specify path to module`);
        }

        if (!outputDirectory) {
            this.error.cli(`provide output directory`);
        }

        // Run module
        this.dispatch(directory, outputDirectory);
    }

    async dispatch(directory, outputDirectory) {
        if (fs.existsSync(outputDirectory)) {
            if (!fs.statSync(outputDirectory).isDirectory()) {
                this.error.cli(`${outputDirectory} exists but is not a directory.`)
            }
        } else {
            await fs.mkdirp(outputDirectory);
        }

        const { index, module } = await this.executeModule(directory);

        const items = [];
        const sources = index.root.globalScope.statements;

        for (let i = 0; i < sources.length; i++) {
            const scope = sources[i].scope;
            for (const [_, value] of scope.ids) {
                items.push(...value);
            }
        }

        const docGen = new DocGen(items);
        console.log(JSON.stringify(docGen.generate(), null, 4));
    }
}
