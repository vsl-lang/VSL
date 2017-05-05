@include "ws.ne"
CodeBlock[statement] -> (_ $statement ( ";" | "\n" ) {% nth(1) %}):* (_ $statement _ {% nth(1) %}) {% d => d[0].concat(d[1]) %}
