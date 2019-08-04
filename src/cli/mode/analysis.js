import CLIMode from '../CLIMode';
import * as analyses from '../analysis';
import fs from 'fs-extra';

import AnalysisContext from '../AnalysisContext';
import CompilationStream from '../../index/CompilationStream';
import VSLToolchain from '../../toolchain/Toolchain';
import DataSourceType from '../../toolchain/DataSourceType';

const Analyses = new Map([
    ["ast", {
        description: `The ast analysis provides a user-friendly colored view ` +
            `of the AST of a VSL file. This ast is the processed AST not the ` +
            `raw parser output. `,
        acceptsModule: false,
        inputType: 'stream',
        implementation: analyses.Ast
    }],
    ["dd", {
        description: `This provides the dynamic-dispatch breakdown of a method.` +
            `To use this provide a method query as the parameter. This provides ` +
            `a user-friendly list of overriding functions and implementations.`,
        inputType: 'toolchain'
    }],
    ["iht", {
        description: `Inheritance analysis. This provides a user-friendly view ` +
            `as a tree of the inheritance hierarchy above and below a class. ` +
            `Provide a type query as the parameter.`,
        inputType: 'toolchain',
        implementation: analyses.Inheritance
    }]
]);

export default class Analysis extends CLIMode {
    usage = "vsl analysis <analysis type> [files] [analysis options]"

    constructor() {
        super([
            ["Options", [
                ["-h", "--help"          , "Displays this help message",             { run: _ => _.help() }]
            ]]
        ]);
    }

    appInfo() {
        return `The VSL \`analysis\` command processes VSL files or a module ` +
            `and performs the appropriate analysis. You can use this to debug ` +
            `your app or obtain information about a VSL file. Some examples: \n\n` +
            `   vsl analysis ast test.vsl \n\n` +
            `   vsl analysis dd test.vsl Animal#makeNoise() \n\n` +
            `   vsl analysis iht test.vsl Animal \n\n` +
            `You can also use the \`vsl analysis list\` command to ` +
            `get information on each.`;
    }

    listCommands() {
        const commands = [];

        for (const [cmd, { description }] of Analyses) {
            commands.push(
                `\u001B[1mvsl analysis \u001B[4m${cmd}\u001B[0m: ${this.limitWordLength(description)}`
            );
        }

        this.printAndDie(commands.join('\n\n'));
    }

    async run(args) {
        if (args[0] === "list") {
            this.listCommands();
        } else if (!args[0]) {
            this.help();
        } else {
            const commandName = args[0];
            const command = Analyses.get(commandName);

            if (!command) {
                this.error.cli(
                    `Unknown command ${commandName}. See \`vsl analysis list\` ` +
                    `for a list of comamnds. For help run \`vsl analysis\``
                );
            }

            // Check if argument is file
            const inputPath = args[1];
            if (!inputPath) {
                this.error.cli(`Provide an input path`);
            } else if (!await fs.pathExists(inputPath)) {
                this.error.cli(`The path \`${inputPath}\` is not a valid module or file.`);
            }

            const inputIsModule = (await fs.stat(inputPath)).isDirectory();

            // Handle command
            const {
                implementation,
                acceptsModule = true,
                inputType = 'toolchain'
            } = command;

            if (!acceptsModule && inputIsModule) {
                this.error.cli(`The command \u001B[1;4m${commandName}\u001B[0m does not accept modules as an argument.`);
            }

            const context = new AnalysisContext({
                commandName: commandName,
                errorManager: this.error,
                args: args.slice(2)
            })

            switch (inputType) {
                case 'toolchain':
                    const toolchain = new VSLToolchain();

                    try {
                        const compilationInstance = inputIsModule ?
                            await toolchain.compileModule(inputPath) :
                            await toolchain.compileFiles([{
                                type: DataSourceType.file,
                                data: inputPath
                            }]);

                        await implementation(compilationInstance, context);

                    } catch(error) {
                        this.error.dynamicHandle(error);
                    }

                    break;
                case 'stream':
                    // Get file constant
                    const data = await fs.readFile(inputPath, { encoding: 'utf-8' });
                    const stream = CompilationStream.createConstantStream(data, inputPath);

                    await implementation(stream, context);
                    break;
                default:
                    this.error.cli(`The command \u001B[1;4m${commandName}\u001B[0m uses unsupported input type ${inputType}`);
            }
        }
    }
}
