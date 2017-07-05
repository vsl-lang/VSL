import CLIMode from '../CLIMode';
import child_process from 'child_process';
import path from 'path';
import fs from 'fs-extra';

const BINDGEN_SRC = "https://github.com/vsl-lang/vsl-bindgen/archive/master.zip"

// Helper function:
const sleep = (time) => new Promise(f => setTimeout(f, time))

export default class Bindgen extends CLIMode {
    usage = "vsl bindgen source.h out.vsl -- [ clang opts ... ]\nvsl bindgen install"
    
    constructor() {
        super([
            ["Options", [
                ["-h", "--help"   , "Displays this help message",                     { run: _ => _.help() }],
                ["-d", "--debug"   , "Print extra information, to help squish bugs.", { debug: true }],
                ["-c", "--color"   , "Prettify output with colors. ",                 { color: true }],
                ["-C", "--no-color", "Disable all colors. ",                          { color: false }]
            ]]
        ]);
        
        this.debug = false;
        this.color = process.stdin.isTTY;
    }
    
    run(args) {
        if (args[0] === "install") {
            this.install();
            return;
        }
        
        let clangArgs = [];
        let input = null;
        let output = null;
        
        for (let i = 0; i < args.length; i++) {
            if (args[i] === "--") {
                clangArgs = args.slice(i + 1);
                break;
            }
            
            let flag = this.getFlagData(args[i]);
            if (flag === null) {
                if (i === 0) input = args[i];
                else if (i === 1) output = args[i];
                else this.error.cli(`invalid argument \`${args[i]}\`, filename should be first two args.`);
                continue;
            }
            
            let { arg, data: { run, debug, color } }  = flag;
            if (run) run(this);
            if (debug) this.debug = debug;
            if (color) this.color = color;
        }
        
        if (!input || !output) this.help();
        this.executeBindgen(input, output, clangArgs);
    }
    
    install() {
        this.error.cli(
            `Information to install VSL-BINDGEN at: https://git.io/vsl-bindgen`
        );
    }
    
    executeBindgen(input, output, clangArgs) {
        let proc;
        try {
            proc = child_process.spawn(
                'vsl-bindgen',
                [ input, output, ...clangArgs ],
                {
                    stdio: [
                        'ignore',
                        this.debug ? 'inherit' : 'ignore',
                        'pipe'
                    ]
                }
            )
        } catch(e) {
            this.error.cli(
                `Could not launch vsl-bindgen; make sure you have vsl-bindgen` +
                ` installed, if you don't. Run \`vsl bindgen install\` to` +
                ` install it. More information at: https://git.io/vsl-bindgen`
            );
        }
        
        proc.stderr.on('data', rawData => {
            let data = rawData.toString('utf-8');
            
            let error = data.match(/^(?:vsl-bindgen: )?(err|warn)\((\d+)\): (.+)/m);
            if (error === null) return this.debug && console.error(data);
            
            let [, type, number, message] = error;
            
            let num = this.ansify(`#${number}`, '1');
            switch(type) {
                case "err":
                    console.error(`${this.ansify('Error', '1;31')} ${num}: ${message}`);
                    break;
                case "warn":
                    console.warn(`${this.ansify('Warning', '1;33')} ${num}: ${message}`);
                    break;
                default:
                    if (debug) process.stderr.write(data);
            }
        })
    }
    
    ansify(string, col) {
        return this.color ? `\u001B[${col}m${string}\u001B[0m` : string;
    }
}
