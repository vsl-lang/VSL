# Parses a rough VSL class

@include "ws.ne"
@include "primitives.ne"
@include "codeBlock.ne"
@include "function.ne"
@include "modifiers.ne"
@builtin "postprocessors.ne"

ExtensionList -> (delimited[Identifier, _ "," _] _ {% id %}):? {% id %}

ClassItem[s] -> FunctionStatement[$s] {% id %}
InterfaceItem -> FunctionHead {% id %}

InterfaceItems[s] -> CodeBlock[(InterfaceItem | ClassItem[$s]) {% mid %}] {% id %}
ClassItems[s] -> CodeBlock[ClassItem[$s] {% id %}] {% id %}

ClassStatement[s] -> Modifier "class" _ Identifier _ ExtensionList "{" _ (ClassItems[$s] _ {% id %}):? "}" {%
    (d, l) => new t.ClassStatement(
        d[0],
        d[3],
        d[5],
        d[8],
        l
    )
%}
InterfaceStatement[s] -> Modifier "interface" _ Identifier _ ExtensionList "{" _ (InterfaceItems[$s] _):? "}"
