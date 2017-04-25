# VSL - Primary Parser  
# most of the more complicated elements are 
# placed in a different file, or if it is a
# terminal, you'll likely need to check
# parser/ for such information

@{% var t = require('./nodes') %}

@include "ws.ne"
@include "expr.ne"

main -> (_ statement __ end {% d => d[1] %}):* end_statement {% d => d[0].concat(d[1]) %}
end_statement -> _ statement _ {% d => d[1] %}
end -> ";" | "\n"

statement -> Expression {% (d, l) => new t.ExpressionStatement(d[0], l) %}
