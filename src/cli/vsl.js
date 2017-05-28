#!/usr/bin/env node
import VSLParser from '../vsl/parser/vslparser';
import VSLTokenizer from '../vsl/parser/vsltokenizer';

import VSLPreprocessor from '../vsl/transform/transformers/vslpreprocessor';
import VSLTransformer from '../vsl/transform/transformers/vsltransformer';

import readline from 'readline';
import util from 'util';
import colors from 'colors';
import { readFileSync } from 'fs';
import minimist from 'minimist';
import pjson from '../../package.json';

const print = console.log,
    stdin = process.stdin,
    argv = minimist(process.argv.slice(2),  {
        alias: {
            help: 'h',
            parserrepl: 'p',
            tokenizerrepl: 't',
            transformrepl: 'r',
            code: 'c'
        },
        booleans: [
        ],
        default: {
        }
    }),
    tokenizer = new VSLTokenizer();

let code = '',
    parser = new VSLParser(),
    rl;

stdin.setEncoding('utf-8');

function display (output) {
    print(util.inspect(output, {showHidden: false, depth: null, colors: true}));
}

function feed (code) {
    let result;
    if ((result = parser.feed(code))) {
        return result;
    } else {
        if (result === null)
            return;
        print("Syntax Error".red + ": ");
        //TODO: tokenizer now returns formatted error
        print(parser.error.message);
    }
}

function exit () {
    process.exit();
}

function help () {
    print(`VSL: Versatile Scripting Language, v${pjson.version}
Usage: vsl PATH_TO_VSL_FILE

Options:
    -h, --help          Show help

Debug REPLs:
    -p, --parserrepl    Start parser REPL
    -t, --tokenizerrepl Start tokenizer REPL
    -r, --transformrepl Start parser -> VSLTransformer REPL
    -c, --code CODE     Parse CODE`) || exit();
}

if (argv.help)
    help();

if (argv._.length)
    display(feed(readFileSync(argv._[0]))) || exit();

if (argv.code)
    display(feed(argv.code)) || exit();

if (argv.p || argv.t || argv.r)
    rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

if (argv.r) {
    function prompt() {
        rl.setPrompt('vsl:transform> '.red.bold);
        rl.prompt();
    }
    prompt();
    let feeding = false;
    rl.on('line', function (input) {
        if (input === 'exit')
    		exit(rl.close());
        if (feeding === true) {
            let result = feed(input);
            if (typeof result === 'undefined') {
                feeding = false;
                prompt();
            } else if (result.length > 0) {
                feeding = false;
                display(result);
                prompt();
            } else
                rl.prompt();
            return;
        }
        parser = new VSLParser();
    	let result = feed(input);
    	
        new VSLPreprocessor().queue(result);
        new VSLTransformer().queue(result);

    	
    	if (typeof result === 'undefined')
    	    return prompt();
    	// check if got any tokens at all
    	// i.e. skip if all comments or no input
    	if (result.tokens && result.length < 1) {
    	    feeding = true;
    	    rl.setPrompt('>>>>>>>>>>>>>> '.bold);
    	    return rl.prompt();
    	}
    	console.log(result[0].toString());
        prompt();
    });
}

if (argv.p) {
    function prompt() {
        rl.setPrompt('vsl:parser> '.red.bold);
        rl.prompt();
    }
    prompt();
    let feeding = false;
    rl.on('line', function (input) {
        if (input === 'exit')
    		exit(rl.close());
        if (feeding === true) {
            let result = feed(input);
            if (typeof result === 'undefined') {
                feeding = false;
                prompt();
            } else if (result.length > 0) {
                feeding = false;
                display(result);
                prompt();
            } else
                rl.prompt();
            return;
        }
        parser = new VSLParser();
    	let result = feed(input);
    	if (typeof result === 'undefined')
    	    return prompt();
    	// check if got any tokens at all
    	// i.e. skip if all comments or no imput
    	if (result.tokens && result.length < 1) {
    	    feeding = true;
    	    rl.setPrompt('>>>>>>>>>>> '.bold);
    	    return rl.prompt();
    	}
    	display(result);
        prompt();
    });
}

if (argv.t) {
    rl.setPrompt('vsl:tokenizer> '.red.bold);
    rl.prompt();
    rl.on('line', function(input) {
        if (input === 'exit')
    		rl.close() || exit();
    	display(tokenizer.tokenize(input));
        rl.prompt();
    });
}

if (!argv.p && !argv.t && !argv.r) {
    stdin.on('readable', function () {
        let chunk = process.stdin.read();
        if (chunk)
            code += chunk;
        else if (!code)
            help();
        while ((chunk = process.stdin.read()))
            code += chunk;
    });
    stdin.on('end', function () {
        display(feed(code));
        exit();
    });
}