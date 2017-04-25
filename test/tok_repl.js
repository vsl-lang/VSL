var VSLTokenizer = require('../lib/vsl/parser/vsltokenizer').VSLTokenizer;
var readline = require('readline');
var util = require('util');

var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.setPrompt('vsl:tokenizer> ');
rl.prompt();

rl.on('line', function(input) {
    if (input === 'exit') {
		rl.close();
	}
	
	let parser = new VSLTokenizer();
	console.log(util.inspect(parser.tokenize(input), false, null));
    
    rl.prompt();
    process.stdin.resume();
})