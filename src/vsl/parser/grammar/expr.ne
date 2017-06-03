# Parses an expression
# `Expression` may be empty

@{%
const literal = (d, l) => new t.Literal(d[0][0], d[0][1], l),
  expr = (d, l, f) => new t.ExpressionStatement(d[0], l);

function recursiveProperty(head, tail, optional, location) {
  if (tail.length === 0)
    return head;
  for (let i = 0; i < tail.length - 1; i++)
    tail[i + 1].head = tail[i];
  tail[0].head = head;
  tail[tail.length - 1].optional = optional;
  //console.log('ok', require('util').inspect(tail[tail.length - 1], {depth: null}));
  return tail[tail.length - 1];
}

%}

@builtin "postprocessors.ne"
@include "ws.ne"
@include "primitives.ne"
@include "codeBlock.ne"

# === Comamnd Chain ===
# QUETION: do we allow class, function etc in closure
# like imo we should in normal functions bc even though snek does it i think is good
# hmm we should make it property
# also why is it not parsing correctly halp very much
# CommandChain -> Property CommandChainPart:+ {% (d, l) => recursiveProperty(d[0], d[1], l) %}

# # TODO: optional (foo? bar == foo?.bar)
# CommandChainPart -> (ArgumentCallHead ("," _ ArgumentCall {% nth(2) %}):* {% d => [d[0]].concat(d[1]) %}):? "{" CodeBlock[Expression] "}" {% (d, l) => new t.FunctionCall(null, d[0].concat([d[2]]), false, l) %}
#                   | ArgumentCallHead ("," _ ArgumentCall {% nth(2) %}):+ {% (d, l) => new t.FunctionCall(null, [d[0]].concat(d[1]), false, l) %}
#                   | ArgumentCallHead {%
#                   // O: KEEP
#                     (d, l) => console.log('asadsdasfajf', t.Tuple) || d[0] instanceof t.Identifier ? new t.PropertyExpression(null, d[0], false, l) : d[0] instanceof t.Tuple ? new t.FunctionCall(null, console.log(d[0].tuple) || d[0].tuple.map(item => new t.ArgumentCall(item, null, item.position)), l) : new t.FunctionCall(null, [d[0]], false, l)
#                   %}
#: d[0] instanceof t.Tuple ? new t.FunctionCall(null, d[0].tuple.map(item => new t.ArgumentCall(item, null, item.position)), l) :

# ArgumentCallHead -> %identifier ":" Expression {% (d, l, f) => d[2] instanceof t.UnaryExpression ? f : new t.ArgumentCall(d[2], d[0], l) %}
#                   | Expression {% (d, l, f) => d[0] instanceof t.UnaryExpression ? f : new t.ArgumentCall(d[0], null, l) %}
# ArgumentCall -> NamedArgumentCall {% id %}
#               | UnnamedArgumentCall {% id %}

# NamedArgumentCall -> %identifier ":" Expression {% (d, l) => new t.ArgumentCall(d[2], d[0], l) %}

# UnnamedArgumentCall -> Expression {% (d, l) => new t.ArgumentCall(d[0], null, l) %}




# === Prop ===
FunctionCallArgument -> %identifier _ ":" _ Expression {% (d, l) => new t.ArgumentCall(d[4], d[0], l) %}
                      | Expression                     {% (d, l) => new t.ArgumentCall(d[0], null, l) %}
                      
FunctionCallList -> delimited[FunctionCallArgument {% id %}, _ "," _] {% (d, l) => new t.FunctionCall(null, d[0], l) %}

Expression -> BinaryExpression {% expr %}

# Properties
Property -> propertyHead (_ propertyTail {% nth(1) %}):* {% (d, l) => (d[1].length === 0 ? d[0] : (d = recursiveProperty(d[0], d[1], l))) %}
          | "?" (_ nullableProperty {% d => d[1] %}):* {% (d, l) => (d[1].length === 0 ? new t.Whatever(l) : recursiveProperty(new t.Whatever(l), d[1], l)) %}

propertyHead -> Literal                {% id %}
              | Identifier             {% id %}
              | "(" _ Expression _ ")" {% nth(2) %}
              | FunctionizedOperator   {% id %}

propertyTail -> "." _ Identifier                                    {% (d, l) => new t.PropertyExpression(null, d[2], false, l) %}
              | "[" _ (delimited[Expression, "," _] {% id %}) _ "]" {% (d, l) => new t.Subscript(null, d[2], false, l) %}
              | nullableProperty                                    {% id %}
              
nullableProperty -> "?" "." _ Identifier                                    {% (d, l) => new t.PropertyExpression(null, d[3], true, l) %}
                  | "?" "[" _ (delimited[Expression, "," _] {% id %}) _ "]" {% (d, l) => new t.Subscript(null, d[3], true, l) %}
                  | "(" _ FunctionCallList _ ")"                            {% nth(2) %}

Literal -> %decimal   {% literal %}
         | %integer   {% literal %}
         | %string    {% literal %}
         | Array      {% id %}
         | Dictionary {% id %}
         | Tuple      {% id %}
         | Set        {% id %}
#          | ImmutableDictionary {% id %}

Array -> "[" _ "]"                                           {% (d, l) => new t.ArrayNode([], l) %}
       | "[" _ delimited[Expression {% id %}, _ "," _] _ "]" {% (d, l) => new t.ArrayNode(d[2], l) %}

Dictionary -> "[" _ ":" _ "]"                                                                       {% (d, l) => new t.Dictionary(new Map(), l) %}
            | "[" _ delimited[Expression _ ":" _ Expression {% d => [d[0], d[4]] %}, _ "," _] _ "]" {% (d, l) => new t.Dictionary(new Map(d[2]), l) %}

Tuple -> "(" _ ")"                                                                           {% (d, l) => new t.Tuple([], l) %}
       | "(" _ Expression _ "," _ (delimited[Expression {% id %}, _ "," _] _ {% id %}):? ")" {% (d, l) => new t.Tuple(d[6] ? [d[2]].concat(d[6]) : [d[2]], l) %}

# ImmutableDictionary -> "[" ":" "]"                                {% (d, l) => new t.ImmutableDictionary(new Map(), l) %}
#                      | "[" delimited[Key ":" Expression, ","] ")" {% (d, l) => new t.ImmutableDictionary(new Map(d[1]), l) %}

Set -> "{" _ "}"                                             {% (d, l) => new t.SetNode([], l) %}
     | "{" _ delimited[Expression {% id %} , _ "," _]  _ "}" {% (d, l) => new t.SetNode(d[2], l) %}
     
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

Ternary -> Assign "?" Ternary ":" Assign {% (d, l) => new t.Ternary(d[0], d[2], d[4], l) %} | Assign {% id %}
Assign -> BinaryOpRight[Assign, ("=" | ":=" | "<<=" | ">>=" | "+=" | "-=" | "/=" | "*=" | "%=" | "**=" | "&=" | "|=" | "^="), Is] {% id %}
Is -> BinaryOp[Is, ("is" | "issub"), Comparison]        {% id %}
Comparison -> BinaryOp[Comparison, ("==" | "!=" | "<>" | "<=>" | "<=" | ">=" | ">" | "<"), Or]  {% id %}
Or -> BinaryOp[Or, ("||"), And]                         {% id %}
And -> BinaryOp[And, ("&&"), Shift]                     {% id %}
Shift -> BinaryOp[Shift, ("<<" | ">>"), Sum]            {% id %}
Sum -> BinaryOp[Sum, ("+" | "-"), Product]              {% id %}
Product -> BinaryOp[Product, ("*" | "/"), Power]        {% id %}
Power -> BinaryOp[Power, ("**"), Bitwise]               {% id %}
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

