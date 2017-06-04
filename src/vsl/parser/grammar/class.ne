# Parses a rough VSL class

@include "ws.ne"
@include "primitives.ne"
@include "codeBlock.ne"
@include "function.ne"
@include "modifiers.ne"
@builtin "postprocessors.ne"

ClassStatement[s]
   -> Modifier "class" _ classDeclaration _
        (":" _ ExtensionList _ {% nth(2) %}):? "{"
        (ClassItems[$s] {% id %}) "}" {%
        (data, location) =>
            new t.ClassStatement(data[0], data[3], data[5], data[7], location)
    %}
InterfaceStatement[s]
   -> Modifier "interface" _ classDeclaration _
        (":" _ ExtensionList _ {% nth(2) %}):? "{"
        (InterfaceItems[$s] {% id %}) "}" {%
        (data, location) =>
            new t.InterfaceStatement(data[0], data[3], data[5], data[7],
                location)
    %}

ExtensionList
   -> delimited[type {% id %}, _ "," _] {% id %}

ClassItems[s]
   -> CodeBlock[ClassItem[$s] {% id %}] {% id %}
InterfaceItems[s]
   -> CodeBlock[(InterfaceItem | ClassItem[$s]) {% mid %}] {% id %}

ClassItem[s]
   -> FunctionStatement[$s] {% id %}
InterfaceItem
   -> FunctionHead {% id %}
