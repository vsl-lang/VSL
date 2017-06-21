# Parses an expression
# `Expression` may be empty




@builtin "postprocessors.ne"
@include "ws.ne"
@include "primitives.ne"
@include "codeBlock.ne"

# === Comamnd Chain ===
# QUETION: do we allow class, function etc in closure
# like imo we should in normal functions bc even though snek does it i think is good
# hmm we should make it property
CommandChain -> Property CommandChainPart:+ {% (d, l) => new t.ExpressionStatement(recursiveCommandChain(d[0], d[1]), l) %}

Closure -> "{" CodeBlock[Expression {% id %}] "}" {% (d, l) => d[1] %}

# TODO: optional (foo? bar == foo?.bar)
CommandChainPart -> (ArgumentCallHead (_ "," _ ArgumentCall {% nth(3) %}):+ {% d => [d[0]].concat(d[1]) %}):? Closure {% (d, l) => new t.FunctionCall(null, (d[0] || []).concat([new t.ArgumentCall(d[1], null, l)]), false, l) %}
                  | ArgumentCallHead (_ "," _ ArgumentCall {% nth(3) %}):+ {% (d, l) => new t.FunctionCall(null, [d[0]].concat(d[1]), false, l) %}
                  | %identifier ":" Expression {% (d, l, f) => d[2].expression instanceof t.UnaryExpression ? f : new t.ArgumentCall(d[2].expression, d[0], l) %}
                  | Expression {%
                    (d, l, f) => ([t.UnaryExpression, t.Tuple, t.SetNode, t.ArrayNode, t.Whatever, t.ParenthesizedExpression, t.Subscript, t.PropertyExpression].some(type => d[0].expression instanceof type)) ?
                      f :
                      d[0].expression instanceof t.Identifier ?
                        new t.PropertyExpression(null, d[0].expression, false, l) :
                        new t.FunctionCall(null, [new t.ArgumentCall(d[0], null, l)], false, l)
                  %}

ArgumentCallHead -> %identifier ":" Expression {% (d, l, f) => d[2].expression instanceof t.UnaryExpression ? f : new t.ArgumentCall(d[2].expression, d[0], l) %}
                  | Expression {% (d, l, f) => d[0].expression instanceof t.UnaryExpression ? f : new t.ArgumentCall(d[0].expression, null, l) %}

#  == Prop ==

Expression -> BinaryExpression {% expr %}

# Properties
Property -> propertyHead (_ propertyTail {% nth(1) %}):* {% (d, l) => (d[1].length === 0 ? d[0] : (d = recursiveProperty(d[0], d[1]))) %}
          | "?" _ nullableProperty (_ propertyTail {% nth(1) %}):* {% (d, l) => recursiveProperty(new t.Whatever(l), [d[2]].concat(d[3])) %}
          | "?" {% (d, l) => new t.Whatever(l) %}

propertyHead -> Literal                {% id %}
              | Identifier             {% id %}
              | "(" _ Expression _ ")" {% (d, l) => new t.ParenthesizedExpression(d[2], l) %}
              | FunctionizedOperator   {% id %}

propertyTail -> "." _ Identifier {% (d, l) => new t.PropertyExpression(null, d[2], false, l) %}
              | Array            {% (d, l) => new t.Subscript(null, d[0].array, false, l) %}
              | nullableProperty {% id %}
              
nullableProperty -> "?" "." _ Identifier                                    {% (d, l) => new t.PropertyExpression(null, d[3], true, l) %}
                  | "?" Array                                               {% (d, l) => new t.Subscript(null, d[1].array, true, l) %}
                  | "(" _ (UnnamedArgumentCall _ "," _ {% id %}):* NamedArgumentCall (_ "," _ ArgumentCall {% nth(3) %}):* _ ")" {% (d, l) => new t.FunctionCall(null, d[2].concat([d[3]]).concat(d[4]), l) %}
                  | Tuple {% (d, l) => new t.FunctionCall(null, d[0].tuple.map(item => new t.ArgumentCall(item)), l) %}
                  | "(" _ Expression _ ")" {% (d, l) => new t.FunctionCall(null, [new t.ArgumentCall(d[2], d[2].expression.position)], l) %}

ArgumentCall -> NamedArgumentCall   {% id %}
              | UnnamedArgumentCall {% id %}

NamedArgumentCall -> %identifier ":" Expression {% (d, l) => new t.ArgumentCall(d[2].expression, d[0], l) %}

UnnamedArgumentCall -> Expression {% (d, l) => new t.ArgumentCall(d[0].expression, null, l) %}


Literal -> %decimal   {% literal %}
         | %integer   {% literal %}
         | %string    {% literal %}
         | Array      {% id %}
         | Dictionary {% id %}
         | Tuple      {% id %}
         | Set        {% id %}
#          | ImmutableDictionary {% id %}

Array -> "[" _ "]" {% (d, l) => new t.ArrayNode([], l) %}
       | "[" _ delimited[Expression, _ "," _] _ "]" {% (d, l) => new t.ArrayNode(d[2], l) %}

Dictionary -> "[" _ ":" _ "]" {% (d, l) => new t.Dictionary(new Map(), l) %}
            | "[" _ delimited[Key _ ":" _ Expression {% (d, l) => [d[0], d[4]] %}, _ "," _] _ "]" {% (d, l) => new t.Dictionary(new Map(d[2]), l) %}

Tuple -> "(" _ ")" {% (d, l) => new t.Tuple([], l) %}
       | "(" _ Expression _ "," _ ")" {% (d, l) => new t.Tuple([d[2]], l) %}
       | "(" _ Expression _ "," _ delimited[Expression, _ "," _] _ ")" {% (d, l) => new t.Tuple([d[2]].concat(d[6]), l) %}

ImmutableDictionary -> "(" _ ":" _ ")" {% (d, l) => new t.ImmutableDictionary(new Map(), l) %}
#                      | "(" delimited[Key ":" Expression, ","] ")" {% (d, l) => new t.ImmutableDictionary(new Map(d[1]), l) %}

Set -> "{" _ "}" {% (d, l) => new t.SetNode([], l) %}
     | "{" _ delimited[Expression, _ "," _] _ "}" {% (d, l) => new t.SetNode(d[2], l) %}

Key -> Expression {% d => d[0] instanceof t.Identifier ? new t.Literal(d[0].identifier, NodeTypes.String, l) : d[0] %}
     
# Primitiveish Things
# Not really used by this file except for lambdas
FunctionArgumentList -> ArgumentList (_ "->" _ type {% nth(3) %}):?

ArgumentList -> "(" delimited[Argument {% id %}, _ "," _]:? ")" {% nth(1) %}
Argument -> TypedIdentifier ( _ "=" _ (Expression {% id %}) {% nth(3) %}):? {% (d, l) => new t.FunctionArgument(d[0], d[1], l) %}

# Operators

## Match a generic operator
## This handles whitespace
BinaryOp[self, ops, next] -> $self $ops _ $next {% (d, l) => new t.BinaryExpression(d[0][0], d[3][0], d[1][0][0].value, l) %} | $next {% mid %}
BinaryOpRight[self, ops, next] -> $next $ops _ $self {% (d, l) => new t.BinaryExpression(d[0][0], d[3][0], d[1][0][0].value, l) %} | $next {% mid %}

# Top level assignment
BinaryExpression -> Ternary {% id %}

# TODO: map operator

Ternary -> Assign "?" Ternary ":" Assign {% (d, l) => new t.Ternary(d[0], d[2], d[4], l) %} | Assign {% id %}
Assign -> BinaryOpRight[Assign, ("=" | ":=" | "<<=" | ">>=" | "+=" | "-=" | "/=" | "*=" | "%=" | "**=" | "&=" | "|=" | "^="), Is] {% id %}
Is -> BinaryOp[Is, ("is" | "issub"), Comparison]        {% id %}
Comparison -> BinaryOp[Comparison, ("==" | "!=" | "<>" | "<=>" | "<=" | ">=" | ">" | "<"), Or]  {% id %}
Or -> BinaryOp[Or, ("||"), And]  {% id %}
And -> BinaryOp[And, ("&&"), Shift]  {% id %}
Shift -> BinaryOp[Shift, ("<<" | ">>"), Sum]  {% id %}
Sum -> BinaryOp[Sum, ("+" | "-"), Product]  {% id %}
Product -> BinaryOp[Product, ("*" | "/"), Power]  {% id %}
Power -> BinaryOpRight[Power, ("**"), Bitwise]  {% id %}
Bitwise -> BinaryOp[Bitwise, ("&" | "|" | "^"), Chain]  {% id %}
Chain -> BinaryOp[Chain, ("~>" | ":>"), Range]          {% id %}
Range -> BinaryOp[Range, (".." | "..."), Cast]          {% id %}
Cast -> BinaryOpRight[Cast, ("::"), Prefix]             {% id %}
Prefix -> ("-" | "+" | "*" | "**" | "!" | "~") Prefix   {% (d, l) => new t.UnaryExpression(d[1], d[0][0].value, l) %}
        | Property {% id %}

## TODO: do we include short-circuit (&& and ||)? if so, how to implement?
## what about assignment
FunctionizedOperator -> "(" (
  "==" | "!=" | "<>" | "<=>" | "<=" | ">=" | ">" | "<" | "<<"
    | ">>" | "+" | "-" | "*" | "/" | "**" | "&" | "|" | "^" | "~>" | ":>"
    | ".." | "..." | "::"
) ")" {% (d, l) => new t.FunctionizedOperator(d[1][0].value, l) %}

