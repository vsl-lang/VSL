import CLIMode from '../CLIMode';
import fs from 'fs-extra';
import glob from 'glob';

export default class Clean extends CLIMode {
    usage = "vsl clean"

    constructor() {
        super([
            ["Options", [
                ["-h", "--help", "Displays this help message", { run: _ => _.help() }],
            ]]
        ]);
    }

    appInfo() {
        return (
            `cleans VSL compilation artifacts.`
        );
    }

    run(args, subcommands) {
        for (let i = 0; i < args.length; i++) {
            if (args[i][0] === "-" && args[i].length > 1) {
                const flagName = this.allArgs[this.aliases[args[i]] || args[i]];
                if (!flagName) this.error.cli(`unknown flag: ${args[i]}`);

                const flagInfo = flagName[3] || flagName[2];

                if (flagInfo.run) flagInfo.run(this);
            }
        }

        this.cleanTemp();
    }

    async cleanTemp() {
        let files = await fs.readdir(process.cwd());

        // Wait for all unlink calls
        let unlinks = [];
        for (let i = 0; i < files.length; i++) {
            if (files[i].indexOf('.vsl-temp') === 0) {
                unlinks.push(fs.unlink(files[i]));
            }
        }

        await Promise.all(unlinks);

        return;
    }
}
