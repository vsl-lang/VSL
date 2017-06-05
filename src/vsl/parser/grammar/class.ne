# Parses a rough VSL class

@include "ws.ne"
@include "primitives.ne"
@include "codeBlock.ne"
@include "function.ne"
@include "modifiers.ne"
@builtin "postprocessors.ne"

ExtensionList -> delimited[type {% id %}, _ "," _] {% id %}

ClassItem[s] -> FunctionStatement[$s] {% id %}
InterfaceItem -> FunctionHead {% id %}

InterfaceItems[s] -> CodeBlock[(InterfaceItem | ClassItem[$s]) {% mid %}] {% id %}
ClassItems[s] -> CodeBlock[ClassItem[$s] {% id %}] {% id %}

AnnotationValue -> %identifier {% mid %}
Annotation -> "@" %identifier ("(" _ delimited[AnnotationValue {% id %}, _ "," _] _ ")" {% nth(2) %}):? {%
    (d, l) => new t.Annotation(d[1][0], d[2], l)
%}

Annotations -> (Annotation _ {% id %}):* {% id %}

ClassStatement[s] -> Annotations Modifier "class" _ classDeclaration _ (":" _ ExtensionList _ {% nth(2) %}):? "{" (ClassItems[$s] {% id %}) "}" {%
    (d, l) => new t.ClassStatement(d[1], d[4], d[6], d[8], d[0], l)
%}

InterfaceStatement[s] -> Annotations Modifier "interface" _ classDeclaration _ (":" _ ExtensionList _ {% nth(2) %}):? "{" (InterfaceItems[$s] {% id %}) "}" {%
    (d, l) => new t.InterfaceStatement(d[1], d[4], d[6], d[7], l)
%}
