@include "ws.ne"
@include "primitives.ne"
@include "expr.ne"
@include "modifiers.ne"
@include "operators.ne"
@builtin "postprocessors.ne"

FunctionBody[s]
   -> "{" (CodeBlock[$s {% id %}] {% id %}) "}" {% nth(1) %}
    | "internal" "(" %identifier ")" {%
        (data, location) => new t.InternalMarker(data[2][0], location)
    %}

FunctionStatement[s]
   -> FunctionHead FunctionBody[$s {% id %}] {%
        data => {
            data[0].statements = data[1];
            return data[0];
        }
    %}

FunctionHead
   -> Modifier ("function"|"func"|"fn")
        (Identifier {% id %} | BinaryOperator {%
            (data, location) => new t.Identifier(data[0].value, location)
        %}) FunctionArgumentList {%
        (data, location) =>
            new t.FunctionStatement(data[0], data[2],
                (data[3] || [])[0] || null, data[3][1], null, location)
    %}
