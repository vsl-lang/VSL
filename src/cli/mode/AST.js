import VSLParser from '../../vsl/parser/vslparser';
import ScopeTraverser from '../../vsl/transform/scopetraverser';
import CLIMode from '../CLIMode';

// vsl ast --find Identifier:1 --map %1 parent(3):2 --filter type %2 FunctionCall --print %1

class ASTTraverser extends ScopeTraverser {
    constructor(process) {
        super(true);
        this.process = process;
    }
    
    receivedNode(parent, name) {
        this.process(parent[name]);
    }
}

export default class AST extends CLIMode {
    usage = "vsl ast <files> [ arguments ... ]"
    
    constructor() {
        super([
            ["Inspection", [
                ["--find"  , "Locates specific AST nodes which match a spec.",                 { name: "find", args: 1 }],
                ["--map"   , "Obtains related elements to the current element queue.",         { name: "map", args: 2 }],
                ["--filter", "Removes items from the element queue which don't match a spec.", { name: "filter", args: 3 }],
                ["--print" , "Prints refs to item matches in a format. If a match isn't there, " +
                             "places an empty string, to exclude use `--print-ff`.",           { name: "print", args: 1 }]
            ]]
        ]);
        
        this.parser = new VSLParser();
        
        this.tasks = [];
        this.items = [];
    }
    
    run(args) {
        let file = null;
        
        for (let i = 0; i < args.length; i++) {
            if (i === 0 && args[i][0] !== "-") {
                file = args[i];
            }
            
            // Handle args
            let arg = args[i];
            let res;
            if ((res = this.allArgs[arg])) {
                let opts = res[3] || res[2];
                let name = opts.name;
                
                let argc = opts.args;
                let optArgs = [];
                
                while (argc --> 0) optArgs.push(args[++i]);
                
                this.tasks.push([name, optArgs]);
            } else {
                this.error.cli(`Unknown argument ${arg}`);
            }
        }
        
        if (file !== null) {
            console.log("ATM VSL cannot source from files");
        } else {
            process.stdin.resume();
            process.stdin.setEncoding('utf8');
            process.stdin.on('data', (data) => {
                if (data) {
                    let res = this.parser.feed(data);
                    if (res.length > 0) this.process(res);
                }
            });
        }
    }
    
    process(res) {
        for (let i = 0; i < this.tasks.length; i++) {
            let args = this.tasks[i][1];
            switch (this.tasks[i][0]) {
                case "find": {
                    let matches = []
                    let traverser = new ASTTraverser(() => {
                    });
                    break;
                }
            }
        }
    }
}
