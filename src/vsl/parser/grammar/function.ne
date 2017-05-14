@include "ws.ne"
@include "primitives.ne"
@include "expr.ne"
@include "modifiers.ne"
@include "operators.ne"
@builtin "postprocessors.ne"

FunctionBody[s] -> "{" _ (CodeBlock[$s] _  {% id %}):? "}" {% nth(2) %} | "internal" {% (_, l) => new t.InternalMarker(l) %}
FunctionStatement[s] -> FunctionHead FunctionBody[$s] {% d => (d[0].statements = d[1], d[0]) %}
FunctionHead -> Modifier ("function"|"func"|"fn") (Identifier {% id %} | BinaryOperator {% (d, l) => new t.Identifier(d[0].value, l) %}) FunctionArgumentList {%
    (d, l) => new t.FunctionStatement(d[0], d[2], (d[3] || [])[0] || null, d[3][1], null, l)
%}