# VSL - Primary Parser  
# most of the more complicated elements are 
# placed in a different file, or if it is a
# terminal, you'll likely need to check
# parser/ for such information

@{%
let t = require('./nodes');
let lexer = new (require('./vsltokenizer'))();
%}

@lexer lexer
@split false
@has false

@include "expr.ne"
@include "codeBlock.ne"
@include "ws.ne"

main -> CodeBlock[statement] {% id %}
statement -> Expression {% id %}
