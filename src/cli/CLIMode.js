import pjson from '../../package.json';
import ErrorManager from './ErrorManager.js';

export default class CLIMode {
    usage = "vsl ..."
    
    constructor(flags) {
        this.flags = flags;
        
        this.aliases = Object.create(null); // [alias => full] object
        this.allArgs = Object.create(null); // [full => entry] object
        
        flags.forEach(
            type => type[1]
                .filter(flag => flag[0][1] !== "-")
                .forEach(flag => this.aliases[flag[0]] = flag[1])
        );
        flags.forEach(
            type => type[1]
                .forEach(flag => this.allArgs[flag[0][1] !== "-" ? flag[1] : flag[0]] = flag)
        );
        
        this.error = new ErrorManager();
    }
    
    run(stream) {
        this.help();
    }
    
    formatFlags() {
        return this.flags.map(section => {
            const format = section[1].map(
                flag => flag[0][1] !== "-" ?
                    `${flag[0]}, ${flag[1]}` :
                    flag[0]
            );
            
            let longest = Math.max(...format.map(i => i.length)) + 1;
            
            const res = format.map(
                (line, i) => (
                    line + " ".repeat(longest - line.length) + (
                        section[1][i][0][1] !== "-" ?
                        section[1][i][2] :
                        section[1][i][1]
                    )
                ).match(/.{1,60}( |$)/g).join("\n  " + " ".repeat(longest))
            )
            
            return `${section[0]}:\n  ${res.join("\n  ")}`
        }).join("\n\n")
    }
    
    version() {
        return pjson["version"];
    }
    
    printAndDie(string) {
        console.log(string);
        process.exit(0);
    }
    
    help() {
        const version = this.version();
        const usageName = "Usage: ";
        const formattedUsage = this.usage
            .split("\n")
            .map((line, nu) => nu > 0 ? usageName.replace(/./g, " ") + line : line);
            
        this.printAndDie(
            `VSL: Versatile Scripting Language v${version}\n` +
            `${usageName}${formattedUsage}\n` +
            `\n` + this.formatFlags()
        );
    }
}
