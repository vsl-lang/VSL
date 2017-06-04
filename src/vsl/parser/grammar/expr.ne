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
# also why is it not parsing correctly halp very much
@{%
function recursiveProperty(head, tail, optional, location) {
    if (tail.length === 0) {
        return head;
    }
    for (let i = 0; i < tail.length - 1; i++) {
        tail[i + 1].head = tail[i];
    }
    tail[0].head = head;
    tail[tail.length - 1].optional = optional;
    //console.log('ok', require('util').inspect(tail[tail.length - 1],
    //    {depth: null}));
    return tail[tail.length - 1];
}
%}

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
FunctionCallArgument
   -> %identifier _ ":" _ Expression {%
        (data, location) => new t.ArgumentCall(data[4], data[0], location)
    %}
    | Expression {%
        (data, location) => new t.ArgumentCall(data[0], null, location)
    %}

FunctionCallList
   -> delimited[FunctionCallArgument {% id %}, _ "," _] {%
        (data, location) => new t.FunctionCall(null, data[0], location)
    %}

Expression
   -> BinaryExpression {%
        (data, location) => new t.ExpressionStatement(data[0], location)
    %}

# Properties
Property
   -> propertyHead (_ propertyTail {% nth(1) %}):* {%
        (data, location) => {
            if (data[1].length === 0) {
                return data[0];
            } else {
                data = recursiveProperty(data[0], data[1], location);
                return data;
            }
        }
    %}
    | "?" (_ nullableProperty {% nth(1) %}):* {%
        (data, location) => {
            if (data[1].length === 0) {
                return new t.Whatever(location);
            } else {
                return recursiveProperty(new t.Whatever(location), data[1],
                    location);
            }
        }
    %}

propertyHead
   -> Literal                {% id %}
    | Identifier             {% id %}
    | "(" _ Expression _ ")" {% nth(2) %}
    | FunctionizedOperator   {% id %}

propertyTail
   -> "." _ Identifier {%
        (data, location) =>
            new t.PropertyExpression(null, data[2], false, location)
    %}
    | "[" _ (delimited[Expression, "," _] {% id %}) _ "]" {%
        (data, location) => new t.Subscript(null, data[2], false, location)
    %}
    | nullableProperty {% id %}

nullableProperty
   -> "?" "." _ Identifier {%
        (data, location) =>
            new t.PropertyExpression(null, data[3], true, location)
    %}
    | "?" "[" _ (delimited[Expression, "," _] {% id %}) _ "]" {%
        (data, location) => new t.Subscript(null, data[3], true, location)
    %}
    | "(" _ FunctionCallList _ ")" {% nth(2) %}

@{%
function literal(data, location) {
    return new t.Literal(data[0][0], data[0][1], location);
}
%}

Literal
   -> %decimal   {% literal %}
    | %integer   {% literal %}
    | %string    {% literal %}
    | Array      {% id %}
    | Dictionary {% id %}
    | Tuple      {% id %}
    | Set        {% id %}
#   | ImmutableDictionary {% id %}

Array
   -> "[" _ "]" {%
        (data, location) => new t.ArrayNode([], location)
    %}
    | "[" _ delimited[Expression {% id %}, _ "," _] _ "]" {%
        (data, location) => new t.ArrayNode(data[2], location)
    %}

Dictionary
   -> "[" _ ":" _ "]" {%
        (data, location) => new t.Dictionary(new Map(), location)
    %}
    | "[" _ delimited[Expression _ ":" _ Expression {%
            data => [data[0], data[4]]
        %}, _ "," _] _ "]" {%
        (data, location) => new t.Dictionary(new Map(data[2]), location)
    %}

Tuple
   -> "(" _ ")" {% (data, location) => new t.Tuple([], location) %}
    | "(" _ Expression _ "," _ (
        delimited[Expression {% id %}, _ "," _] _ {% id %}):? ")" {%
        (data, location) => {
            var tuple = [data[2]];
            if (data[6]) {
                tuple = tuple.concat(data[6]);
            }
            new t.Tuple(tuple, location);
        }
    %}

#ImmutableDictionary
#   -> "[" ":" "]" {%
#        (data, location) => new t.ImmutableDictionary(new Map(), location)
#    %}
#    | "[" delimited[Key ":" Expression, ","] ")" {%
#        (data, location) =>
#            new t.ImmutableDictionary(new Map(data[1]), location)
#    %}

Set
   -> "{" _ "}" {% (data, location) => new t.SetNode([], location) %}
    | "{" _ delimited[Expression {% id %} , _ "," _]  _ "}" {%
        (data, location) => new t.SetNode(data[2], location)
    %}
     
# Primitiveish Things
# Not really used by this file except for lambdas
FunctionArgumentList
   -> ArgumentList (_ "->" _ type {% nth(3) %}):?

ArgumentList
   -> "(" delimited[Argument {% id %}, _ "," _]:? ")" {% nth(1) %}

Argument
   -> TypedIdentifier ( _ "=" _ Expression {% nth(3) %}):? {%
        (data, location) => new t.FunctionArgument(data[0], data[1], location)
    %}

# Operators

## Match a generic operator
## This handles whitespace
BinaryOp[self, ops, next]
   -> $self $ops _ $next {%
        (data, location) =>
            new t.BinaryExpression(data[0][0], data[3][0], data[1][0][0].value,
                location)
    %}
    | $next {% mid %}

BinaryOpRight[self, ops, next]
   -> $next $ops _ $self {%
        (data, location) =>
            new t.BinaryExpression(data[0][0], data[3][0], data[1][0][0].value,
                location)
    %}
    | $next {% mid %}

# Top level assignment
BinaryExpression
   -> Ternary {% id %}

Ternary
   -> Assign "?" Ternary ":" Assign {%
        (data, location) => new t.Ternary(data[0], data[2], data[4], location)
    %}
    | Assign {% id %}
Assign
   -> BinaryOpRight[Assign, ("=" | ":=" | "<<=" | ">>=" | "+=" | "-=" | "/=" |
        "*=" | "%=" | "**=" | "&=" | "|=" | "^="), Is] {% id %}
Is
   -> BinaryOp[Is, ("is" | "issub"), Comparison] {% id %}
Comparison
   -> BinaryOp[Comparison, ("==" | "!=" | "<>" | "<=>" | "<=" | ">=" | ">" |
        "<"), Or]  {% id %}
Or
   -> BinaryOp[Or, ("||"), And] {% id %}
And
   -> BinaryOp[And, ("&&"), Shift] {% id %}
Shift
   -> BinaryOp[Shift, ("<<" | ">>"), Sum] {% id %}
Sum
   -> BinaryOp[Sum, ("+" | "-"), Product] {% id %}
Product
   -> BinaryOp[Product, ("*" | "/"), Power] {% id %}
Power
   -> BinaryOpRight[Power, ("**"), Bitwise] {% id %}
Bitwise
   -> BinaryOp[Bitwise, ("&" | "|" | "^"), Chain] {% id %}
Chain
   -> BinaryOp[Chain, ("~>" | ":>"), Range] {% id %}
Range
   -> BinaryOp[Range, (".." | "..."), Cast] {% id %}
Cast
   -> BinaryOpRight[Cast, ("::"), Prefix] {% id %}
Prefix
   -> ("-" | "+" | "*" | "**" | "!" | "~") Prefix {%
        (data, location) =>
            new t.UnaryExpression(data[1], data[0][0].value, location)
    %}
    | Property {% id %}

## TODO: do we include short-circuit (&& and ||)? if so, how to implement?
## what about assignment
FunctionizedOperator
   -> "(" ("==" | "!=" | "<>" | "<=>" | "<=" | ">=" | ">" | "<" | "<<" | ">>" |
        "+" | "-" | "*" | "/" | "**" | "&" | "|" | "^" | "~>" | ":>" | ".." |
        "..." | "::") ")" {%
        (data, location) =>
            new t.FunctionizedOperator(data[1][0].value, location)
    %}
