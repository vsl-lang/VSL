import CLIMode from '../CLIMode';

export default class Doctor extends CLIMode {
    usage = "vsl doctor"

    constructor() {
        super([
            ["Options", [
                ["-h", "--help"          , "Displays this help message",             { run: _ => _.help() }]
            ]]
        ]);
    }

    appInfo() {
        return `Scans your system and ensures the integrity of all VSL files ` +
            `and dependencies. If issues are found VSL doctor will attempt ` +
            `to suggest. If your issue is a compilation error and not an ` +
            `internal error it is recommended to debug libvsl. Doctor for ` +
            `the standard packages is still in progress.`;
    }

    run(args) {
        for (let i = 0; i < args.length; i++) {
            if (args[i][0] === "-" && args[i].length > 1) {
                const flagName = this.allArgs[this.aliases[args[i]] || args[i]];
                if (!flagName) this.error.cli(`unknown flag: ${args[i]}`);

                const flagInfo = flagName[3] || flagName[2];

                if (flagInfo.run) flagInfo.run(this);
            } else {
                this.error.cli(`unknown parameter: ${args[i]}`);
            }
        }
    }
}
