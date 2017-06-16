#!/usr/bin/env node
import * as modes from './mode';

const subcommands = Object.create(null);

subcommands["run"] = modes.Default;
subcommands["ast"] = modes.AST;

let args = process.argv.slice(2);
let cmd = subcommands[args[0]]
if (!cmd) {
    cmd = modes.Default;
} else {
    args.shift();
}
(new cmd()).run(args);
