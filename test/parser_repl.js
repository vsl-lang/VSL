var VSLParser = require('../lib/vsl/parser/vslparser.js');
var readline = require('readline');
var util = require('util');
var colors = require('colors');

var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function prompt() {
    rl.setPrompt('vsl:parser> '.red.bold);
    rl.prompt();
}
prompt()

function display(output) {
    console.log(util.inspect(output, {showHidden: false, depth: null,colors:true}));
}

let parser;
let feeding = false;
rl.on('line', function(input) {
    
    if (input === 'exit') {
		rl.close();
	}
    
    if (feeding) {
        let res = parser.feed(input);
        if (res.length > 0) {
            feeding = false;
            display(res);
            prompt();
        } else {
            rl.prompt();
        }
        return;
    }
	
	parser = new VSLParser();
	let res = parser.feed(input);
	
	if (res.length < 1) {
	    feeding = true;
	    rl.setPrompt('>>>>>>>>>>> '.bold);
	    return rl.prompt();
	}
	
	display(res);
    
    prompt()
    process.stdin.resume();
})