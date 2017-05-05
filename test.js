var fs = require('fs'), util = require('util');

var VSLParser = require('./lib/vsl/parser/vslparser.js');
var p = new VSLParser();
var ast = p.feed(
    fs.readFileSync("test.vsl")
);
console.log(util.inspect(ast.results, false, null));