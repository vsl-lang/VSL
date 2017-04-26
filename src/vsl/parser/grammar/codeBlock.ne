@include "ws.ne"
CodeBlock[statement] -> (_ $statement ( ";" | "\n" ) {% d => d[1] %}):* (_ $statement _ {% d => d[1] %}) {% d => d[0].concat(d[1]) %}
