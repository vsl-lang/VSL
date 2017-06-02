@include "ws.ne"

CodeBlock[statement] -> seperator:* (delimited[$statement, seperator:+] seperator:* {% nth(0) %}):? {% (d, l) => new t.CodeBlock(d[1] || [], l) %}
seperator -> ";" | "\n"
