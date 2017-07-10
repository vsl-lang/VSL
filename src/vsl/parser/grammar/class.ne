# Parses a rough VSL class

@include "ws.ne"
@include "primitives.ne"
@include "codeBlock.ne"
@include "function.ne"
@include "modifiers.ne"
@builtin "postprocessors.ne"

ExtensionList -> delimited[type {% id %}, _ "," _] {% id %}

OnlyGetter -> Modifier TypedIdentifier Closure {% (d, l) => new t.GetterSetter(new t.Getter(d[0], d[1], d[2]), null, l) %}

ClassItem[s] -> FunctionStatement[$s] {% id %}
InterfaceItem -> FunctionHead {% id %}
  | Modifier AssignmentStatement {% (d, l) => new t.ClassProperty(d[0], d[1], l) %}
  | OnlyGetter {% id %}

InterfaceItems[s] -> CodeBlock[(InterfaceItem | ClassItem[$s]) {% mid %}] {% id %}
ClassItems[s] -> CodeBlock[ClassItem[$s] {% id %}] {% id %}

ClassStatement[s] -> Modifier "class" _ classDeclaration _ (":" _ ExtensionList _ {% nth(2) %}):? "{" (ClassItems[$s] {% id %}) "}" {%
    (d, l) => new t.ClassStatement(d[0], d[3], d[5], d[7], l)
%}

InterfaceStatement[s] -> Modifier "interface" _ classDeclaration _ (":" _ ExtensionList _ {% nth(2) %}):? "{" (InterfaceItems[$s] {% id %}) "}" {%
    (d, l) => new t.InterfaceStatement(d[0], d[3], d[5], d[7], l)
%}
