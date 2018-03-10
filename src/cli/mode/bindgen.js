import CLIMode from '../CLIMode';
import child_process from 'child_process';
import path from 'path';
import fs from 'fs-extra';
import os from 'os';

const BINDGEN_SRC = "https://github.com/vsl-lang/vsl-bindgen/archive/master.zip"

// Helper function:
const sleep = (time) => new Promise(f => setTimeout(f, time))

export default class Bindgen extends CLIMode {
    usage = "vsl bindgen source.h out.vsl -- [ clang opts ... ]\nvsl bindgen install"

    constructor() {
        super([
            ["Arguments", [
                ["-p", "--prefix", "A prefix to remove from identifiers. You " +
                                   "may pass more than one if applicable",            { prefix: true, arg: "id" }]
            ]],
            ["Options", [
                ["-h", "--help"    , "Displays this help message",                    { run: _ => _.help() }],
                ["-d", "--debug"   , "Print extra information, to help squish bugs.", { debug: true }],

                ["-c", "--color"   , "Prettify output with colors. ",                 { color: true }],
                ["-C", "--no-color", "Disable all colors. ",                          { color: false }]
            ]]
        ]);

        this.debug = false;
        this.color = process.stdin.isTTY;
    }

    appInfo() {
        return (
            `vsl bindgen takes C/C++ files and converts the applicable ` +
            `declarations to a VSL binding file.`
        );
    }

    run(args) {
        if (args[0] === "install") {
            this.install();
            return;
        }

        let clangArgs = [];
        let prefixes = [];

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

            let { arg, data: { run, debug, color, prefix } }  = flag;
            if (run) run(this);
            if (debug) this.debug = debug;
            if (color) this.color = color;
            if (prefix) {
                let val = args[++i];
                if (!val) this.error.cli(`expected value to follow argument ${args[i]}`);
                prefixes.push(val);
            }
        }

        if (!input || !output) this.help();
        this.executeBindgen(input, output, clangArgs, { prefixes });
    }

    install() {
        this.error.cli(
            `Information to install VSL-BINDGEN at: https://git.io/vsl-bindgen`
        );
    }

    executeBindgen(input, output, clangArgs, { prefixes = [] }) {
        let proc = child_process.spawn(
            'vsl-bindgen',
            [ input, output, ...clangArgs ],
            {
                stdio: [
                    'pipe',
                    'pipe',
                    'pipe'
                ]
            }
        )

        proc.on('error', (e) => {
            if (e.code === 'ENOENT') {
                this.error.cli(
                    `Could not find vsl-bindgen; make sure you have vsl-bindgen\n` +
                    ` installed, if you don't. Run \`vsl bindgen install\` to\n` +
                    ` install it. More information at: https://git.io/vsl-bindgen`
                );
            } else {
                this.error.cli(
                    `Unknown error while communicating to vsl-bindgen.`
                );
            }
        });

        proc.on('exit', (code) => {
            process.exit(code);
        });

        let endianness = os.endianness();
        function sendOpt(key, value) {
            let buf, offset = 0;

            function writeInt(byte) {
                if (endianness === 'BE') offset = buf.writeUInt32BE(byte, offset);
                else offset = buf.writeUInt32LE(byte, offset)
            }

            // leading + keyid(4) + valuelen(4) + value
            let payloadWidth = Buffer.byteLength(value, 'ascii');
            let length = 1 + 4 + 4 + payloadWidth + 1;

            if (Buffer.allocUnsafe) {
                buf = Buffer.allocUnsafe(length);
            } else {
                buf = new Buffer(length);
            }

            offset = buf.writeUInt8(0x1F, offset);
            writeInt(key);
            writeInt(payloadWidth);
            offset += buf.write(value, offset, payloadWidth, 'ascii');
            offset = buf.writeUInt8(0x1E, offset);

            proc.stdin.write(buf);
        }

        // Send null opt
        sendOpt(0x00, '-');

        prefixes.forEach(prefix => sendOpt(0x4F, prefix));

        proc.stdin.end();

        proc.stdout.on('data', chunk => {
            if (chunk.indexOf('vsl-bindgen: ') === 0) {
                if (this.debug) process.stdout.write(chunk);
            } else {
                process.stdout.write(chunk);
            }
        });

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
