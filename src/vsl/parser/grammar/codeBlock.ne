@include "ws.ne"
@builtin "postprocessors.ne"

CodeBlock[statement]
   -> seperator:* (delimited[$statement {% id %}, seperator:+] seperator:*
            {% id %}):? {%
        (data, location) => new t.CodeBlock(data[1] || [], location)
    %}

seperator
   -> ";"
    | "\n"
