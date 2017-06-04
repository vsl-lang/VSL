# Parses an expression
# `Expression` may be empty

@builtin "postprocessors.ne"
@include "ws.ne"
@include "primitives.ne"
@include "codeBlock.ne"

# QUETION: do we allow class, function etc in closure
# like imo we should in normal functions bc even though snek does it i think is good
# hmm we should make it property
# also why is it not parsing correctly halp very much
@{%
function recursiveProperty(head, tail, location) {
    if (tail.length === 0) {
        return head;
    }
    for (let i = 0; i < tail.length - 1; i++) {
        tail[i + 1].head = tail[i];
    }
    tail[0].head = head;
    return tail[tail.length - 1];
}
%}

CommandChain -> Property CommandChainPart:+ {%
    (data, location) => recursiveProperty(data[0], data[1], location)
%}

# TODO: optional (foo? bar == foo?.bar)
CommandChainPart
   -> (ArgumentCallHead ArgumentCallTail:* {%
            data => [data[0]].concat(data[1])
        %}):? "{" CodeBlock[Expression] "}" {%
        (data, location) => new t.FunctionCall(null, data[0].concat([data[2]]),
            false, location)
    %}
    | ArgumentCallHead ArgumentCallTail:+ {%
        (data, location) => new t.FunctionCall(null, [data[0]].concat(data[1]),
            false, location)
    %}
    | ArgumentCallHead {%
        (data, location) => {
            console.log('asadsdasfajf', t.Tuple);
            if (data[0] instanceof t.Identifier) {
                return new t.PropertyExpression(null, data[0], false, location);
            } else if (data[0] instanceof t.Tuple) {
                console.log(data[0].tuple);
                return new t.FunctionCall(null, data[0].tuple.map(
                    item => new t.ArgumentCall(item, null, item.position)),
                        location);
            } else {
                return new t.FunctionCall(null, [data[0]], false, location);
            }
        }
    %}

@{%
function argumentCallHead0(data, location, reject) {
    if (data[2] instanceof t.UnaryExpression) {
        return reject;
    } else {
        return new t.ArgumentCall(data[2], data[0], location);
    }
}

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

#  == Prop ==
@{%
function functionCallArgument0(data, location, reject) {
    return new t.ArgumentCall(data[4], data[0], location);
}

function functionCallArgument1(data, location, reject) {
    return new t.ArgumentCall(data[0], null, location);
}

function functionCallList(data, location, reject) {
    return new t.FunctionCall(data[0], location);
}
%}

FunctionCallArgument -> %identifier _ ":" _ Expression
                            {% functionCallArgument0 %}
                      | Expression {% functionCallArgument1 %}
                      
FunctionCallList -> delimited[FunctionCallArgument, _ "," _]
                        {% functionCallList %}

@{%
function expr(data, location, reject) {
    return new t.ExpressionStatement(data[0], location);
}
%}

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

ArgumentCall -> NamedArgumentCall {% id %}
              | UnnamedArgumentCall {% id %}

@{%
function namedArgumentCall(data, location, reject) {
    return new t.ArgumentCall(data[2], data[0], location);
}

function unnamedArgumentCall(data, location, reject) {
    return new t.ArgumentCall(data[0], null, location);
}
%}

NamedArgumentCall -> %identifier ":" Expression {% namedArgumentCall %}
UnnamedArgumentCall -> Expression               {% unnamedArgumentCall %}

@{%
function literal(data, location, reject) {
    return new t.Literal(data[0][0], data[0][1], location);
}
%}

Literal -> %decimal            {% literal %}
         | %integer            {% literal %}
         | %string             {% literal %}
         | Array               {% id %}
         | Dictionary          {% id %}
         | Tuple               {% id %}
         # v- ok this name is way too long
#        | ImmutableDictionary {% id %}
         | Set                 {% id %}

@{%
function array0(data, location, reject) {
    return new t.ArrayNode([], location);
}

function array1(data, location, reject) {
    return new t.ArrayNode(data[1], location);
%}

Array -> "[" "]"                            {% array0 %}
       | "[" delimited[Expression, ","] "]" {% array1 %}

@{%
function dictionary0(data, location, reject) {
    return new t.Dictionary(new Map(), location);
}

function dictionary1(data, location, reject) {
    return new t.Dictionary(new Map(data[1]), location);
}
%}

Dictionary -> "[" ":" "]"                                {% dictionary0 %}
            | "[" delimited[Key ":" Expression, ","] "]" {% dictionary1 %}

@{%
function tuple0(data, location, reject) {
    return new t.Tuple([], location);
}

function tuple1(data, location, reject) {
    return new t.Tuple([data[1]].concat(data[3]), location);
%}

Tuple -> "(" ")"                                               {% tuple0 %}
       | "(" Expression "," _ delimited[Expression, "," _] ")" {% tuple1 %}

@{%
function immutableDictionary0(data, location, reject) {
    return new t.ImmutableDictionary(new Map(), location);
}

function immutableDictionary1(data, location, reject) {
    return new t.ImmutableDictionary(new Map(data[1]), location);
}
%}

ImmutableDictionary -> "(" ":" ")" {% immutableDictionary0 %}
#                    | "(" delimited[Key ":" Expression, ","] ")"
#                        {% immutableDictionary1 %}

@{%
function set0(data, location, reject) {
    return new t.SetNode([], location);
}

function set1(data, location, reject) {
    return new t.SetNode(data[1], location);
}
%}

Set -> "{" "}"                            {% set0 %}
     | "{" delimited[Expression, ","] "}" {% set1 %}

Key -> Identifier         {% id %}
     | "[" Expression "]" {% nth(1) %}
     
# Primitiveish Things
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

@{%
function ternary(data, location, reject) {
    return new t.Ternary(data[0], data[2], data[4], location);
}

function prefix(data, location, reject) {
    return new t.UnaryExpression(data[1], data[0][0].value, location);
}
%}

Ternary -> Assign "?" Ternary ":" Assign {% ternary %}
         | Assign                        {% id %}
Assign -> BinaryOpRight[Assign, ("=" | ":=" | "<<=" | ">>=" | "+=" | "-=" |
                                 "/=" | "*=" | "%=" | "**=" | "&=" | "|=" |
                                 "^="), Is] {% id %}
Is -> BinaryOp[Is, ("is" | "issub"), Comparison] {% id %}
Comparison -> BinaryOp[Comparison, ("==" | "!=" | "<>" | "<=>" | "<=" | ">=" |
                                    ">" | "<"), Or]  {% id %}
Or -> BinaryOp[Or, ("||"), And]  {% id %}
And -> BinaryOp[And, ("&&"), Shift]  {% id %}
Shift -> BinaryOp[Shift, ("<<" | ">>"), Sum]  {% id %}
Sum -> BinaryOp[Sum, ("+" | "-"), Product]  {% id %}
Product -> BinaryOp[Product, ("*" | "/"), Power]  {% id %}
Power -> BinaryOp[Power, ("**"), Bitwise]  {% id %}
Bitwise -> BinaryOp[Bitwise, ("&" | "|" | "^"), Chain]  {% id %}
Chain -> BinaryOp[Chain, ("~>" | ":>"), Range]  {% id %}
Range -> BinaryOp[Range, (".." | "..."), Cast] {% id %}
Cast -> BinaryOpRight[Cast, ("::"), Prefix] {% id %}
Prefix -> ("-" | "+" | "*" | "**" | "!" | "~") Prefix {% prefix %}
        | Property {% id %}

## TODO: do we include short-circuit (&& and ||)? if so, how to implement?
## what about assignment
@{%
function functionizedOperator(data, location, reject) {
    return new t.FunctionizedOperator(data[1][0].value, location); 
}
%}

FunctionizedOperator -> "(" ("==" | "!=" | "<>" | "<=>" | "<=" | ">=" | ">" |
                             "<" | "<<" | ">>" | "+" | "-" | "*" | "/" | "**" |
                             "&" | "|" | "^" | "~>" | ":>" | ".." | "...")
                        ")" {% functionizedOperator %}
