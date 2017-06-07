# Parses a rough VSL class

@include "ws.ne"
@include "primitives.ne"
@include "codeBlock.ne"
@include "function.ne"
@include "modifiers.ne"
@builtin "postprocessors.ne"

ClassStatement[s]
   -> Annotations Modifier "class" _ classDeclaration _ (":" _ ExtensionList _
            {% nth(2) %}):? "{" (ClassItems[$s {% id %}] {% id %}) "}" {%
        (data, location) =>
            new t.ClassStatement(data[1], data[4], data[6], data[8], data[0],
                location)
    %}

InterfaceStatement[s]
   -> Annotations Modifier "interface" _ classDeclaration _ (":" _
            ExtensionList _ {% nth(2) %}):? "{" (InterfaceItems[$s {% id %}]
            {% id %}) "}" {%
        (data, location) =>
            new t.InterfaceStatement(data[1], data[4], data[6], data[8],
                data[0], location)
    %}

Annotations
   -> (Annotation _ {% id %}):* {% id %}
Annotation
   -> "@" %identifier ("(" _ delimited[AnnotationValue {% id %}, _ "," _] _
        ")" {% nth(2) %}):? {%
        (data, location) => new t.Annotation(data[1][0], data[2], location)
    %}
AnnotationValue
   -> %identifier {% mid %}

ExtensionList
   -> delimited[type {% id %}, _ "," _] {% id %}

ClassItems[s]
   -> CodeBlock[ClassItem[$s {% id %}] {% id %}] {% id %}
ClassItem[s]
   -> InterfaceItem[$s {% id %}] {% id %}

InterfaceItems[s]
   -> CodeBlock[InterfaceItem[$s {% id %}] {% id %}] {% id %}
InterfaceItem[s]
   -> FunctionHead {% id %}
    | FunctionStatement[$s {% id %}] {% id %}
