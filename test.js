var VSLParser = require('./lib/vsl/parser/vslparser.js');
var p = new VSLParser(); var ast = p.feed("1 + 1");
var VSLTransformer = require('./lib/vsl/transform/vsltransformer');
var t = new VSLTransformer();
t.queue(ast.results);