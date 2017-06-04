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



function argumentCallHead1(data, location, reject) {
    if (data[0] instanceof t.UnaryExpression) {
        return reject;
    } else {
        return new t.ArgumentCall(data[0], null, location);
    }
}
%}

ArgumentCallHead -> %identifier ":" Expression {% argumentCallHead0 %}
                  | Expression                 {% argumentCallHead1 %}

ArgumentCallTail -> "," _ ArgumentCall {% nth(2) %}

# === Prop ===
FunctionCallArgument -> %identifier _ ":" _ Expression {% (d, l) => new t.ArgumentCall(d[4], d[0], l) %}
                      | Expression                     {% (d, l) => new t.ArgumentCall(d[0], null, l) %}
                      
FunctionCallList -> delimited[FunctionCallArgument {% id %}, _ "," _] {% (d, l) => new t.FunctionCall(null, d[0], l) %}

Expression -> BinaryExpression {% expr %}

# Properties
@{%
function property0(data, location, reject) {
    if (data[1].length === 0) {
        return data[0];
    } else {
        data = recursiveProperty(data[0], data[1], location);
        return data;
    }
}

function property1(data, location, reject) {
    if (data[1].length === 0) {
        return new t.Whatever(location);
    } else {
        return recursiveProperty(new t.Whatever(location), data[1], location);
    }
}
%}

Property -> propertyHead (_ propertyTail {% nth(1) %}):* {% property0 %}
          | "?" (_ nullableProperty {% nth(1) %}):*      {% property1 %}

propertyHead -> Literal                {% id %}
              | Identifier             {% id %}
              | "(" _ Expression _ ")" {% nth(2) %}
              | FunctionizedOperator   {% id %}

@{%
function propertyTail0(data, location, reject) {
    return new t.PropertyExpression(null, data[2], false, location);
}

function propertyTail1(data, location, reject) {
    return new t.Subscript(null, data[2], false, location);
}
%}

propertyTail -> "." _ Identifier {% propertyTail0 %}
              | "[" _ (delimited[Expression, "," _] {% id %}) _ "]"
                    {% propertyTail1 %}
              | nullableProperty {% id %}

@{%
function nullableProperty0(data, location, reject) {
    return new t.PropertyExpression(null, data[3], true, location);
}

function nullableProperty1(data, location, reject) {
    return new t.Subscript(null, data[3], true, location);
}
%}

nullableProperty -> "?" "." _ Identifier {% nullableProperty0 %}
                  | "?" "[" _ (delimited[Expression, "," _] {% id %}) _ "]"
                        {% nullableProperty1 %}
                  | "(" _ FunctionCallList _ ")" {% nth(2) %}

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

@{%
function argument(data, location, reject) {
    return new t.FunctionArgument(data[0], data[1], location);
}
%}

Argument -> TypedIdentifier ( _ "=" _ Expression {% nth(3) %}):? {% argument %}

# Operators

## Match a generic operator
## This handles whitespace
@{%
function binaryOp(data, location, reject) {
    return new t.BinaryExpression(data[0][0], data[3][0], data[1][0][0].value,
        location);
}
%}

BinaryOp[self, ops, next] -> $self $ops _ $next {% binaryOp %}
                           | $next              {% mid %}
BinaryOpRight[self, ops, next] -> $next $ops _ $self {% binaryOp %}
                                | $next              {% mid %}

# Top level assignment
BinaryExpression -> Ternary {% id %}

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

