var fs = require('fs'), util = require('util');

var VSLParser = require('./lib/vsl/parser/vslparser.js');
var VSLTransformer = require('./lib/vsl/transform/transformers/vsltransformer');
var ScopeTransverser = require('./lib/vsl/transform/transformers/scopetransverser');

var p = new VSLParser();
var ast = p.feed(
    fs.readFileSync("test.vsl")
    // "1 + 1"
);

// Scopify
new ScopeTransverser().queue(ast);

new VSLTransformer().queue(ast);

console.log(util.inspect(ast, false, null));