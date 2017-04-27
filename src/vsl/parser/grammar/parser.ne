# VSL - Primary Parser  
# most of the more complicated elements are 
# placed in a different file, or if it is a
# terminal, you'll likely need to check
# parser/ for such information

@{%
const t = require('./nodes');
%}

@include "expr.ne"
@include "codeBlock.ne"

main -> CodeBlock[statement]
statement -> Expression {% id %}
