@include "ws.ne"

CodeBlock[statement]
   -> seperator:* (delimited[$statement {% id %}, seperator:+] seperator:* {%
            nth(0)
        %}):? {%
        (data, location) => new t.CodeBlock(data[1] || [], location)
    %}

seperator
   -> ";"
    | "\n"
