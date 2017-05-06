@include "ws.ne"
@include "primitives.ne"
@include "expr.ne"
@include "modifiers.ne"
@builtin "postprocessors.ne"

FunctionBody[s] -> "{" CodeBlock[$s] "}" {% nth(1) %} | "internal" {% (_, l) => new t.InternalMarker(l) %}
FunctionStatement[s] -> FunctionHead FunctionBody[$s] {% d => (d[0].statements = d[1], d[0]) %}
FunctionHead -> Modifier "func" Identifier ArgumentList {%
    (d, l) => new t.FunctionStatement(d[0], d[2], d[3][0], d[3][1], null, l)
%}