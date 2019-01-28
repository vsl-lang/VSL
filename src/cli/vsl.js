#!/usr/bin/env node
import * as modes from './mode';

const subcommands = Object.create(null);
subcommands["run"]   = modes.Default;
subcommands["build"]   = modes.Build;
subcommands["clean"]   = modes.Clean;
subcommands["docgen"] = modes.Docgen;
subcommands["install"] = modes.Install;
subcommands["bindgen"] = modes.Bindgen;
subcommands["debugsrc"] = modes.Debugsrc;
subcommands["parser-server"] = modes.ParserServer;

let args = process.argv.slice(2);
let cmd = subcommands[args[0]];
if (!cmd) {
    cmd = modes.Default;
} else {
    args.shift();
}
(new cmd()).run(args, Object.keys(subcommands));
