# Parses an expression
# `Expression` may be empty

@{%
const literal = (d, l) => new t.Literal(d[0][0], d[0][1], l),
  expr = (d, l) => new t.ExpressionStatement(d[0], l);

function recursiveProperty(head, tail, location) {
  if (tail.length === 0)
    return head;
  for (let i = 0; i < tail.length - 1; i++)
    tail[i + 1].head = tail[i];
  tail[0].head = head;
  return tail[tail.length - 1];
}
%}

@builtin "postprocessors.ne"
@include "ws.ne"
@include "primitives.ne"
@include "codeBlock.ne"

# QUETION: do we allow class, function etc in closure
# like imo we should in normal functions bc even though snek does it i think is good
# hmm we should make it property
CommandChain -> Identifier CommandChainPart:+ {% (d, l) => recursiveProperty(d[0], d[1], l) %}

# TODO: closure node
Closure -> "{" CodeBlock[Expression] "}" {% (d, l) => d[2] %}

# TODO: optional (foo? bar == foo?.bar)
CommandChainPart -> (ArgumentCallHead (_ "," _ ArgumentCall {% nth(3) %}):* {% d => [d[0]].concat(d[1]) %}):? Closure {% (d, l) => new t.FunctionCall(null, d[0].concat([d[1]]), false, l) %}
                  | ArgumentCallHead (_ "," _ ArgumentCall {% nth(3) %}):+ {% (d, l) => new t.FunctionCall(null, [d[0]].concat(d[1]), false, l) %}
                  | %identifier ":" Expression {% (d, l, f) => d[2].expression instanceof t.UnaryExpression ? f : new t.ArgumentCall(d[2].expression, d[0], l) %}
                  | Expression {%
                    (d, l, f) => (d[0].expression instanceof t.UnaryExpression || d[0].expression instanceof t.Tuple || d[0].expression instanceof t.ArrayNode || d[0].expression instanceof t.Whatever) ?
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
Property -> propertyHead (_ propertyTail {% nth(1) %}):* {% (d, l) => (d[1].length === 0 ? d[0] : (d = recursiveProperty(d[0], d[1], l))) %}
          | "?" _ nullableProperty (_ propertyTail {% nth(1) %}):* {% (d, l) => recursiveProperty(new t.Whatever(l), [d[2]].concat(d[3]), l) %}
          | "?" {% (d, l) => new t.Whatever(l) %}

propertyHead -> Literal                {% id %}
              | Identifier             {% id %}
              | "(" _ Expression _ ")" {% nth(2) %}
              | FunctionizedOperator   {% id %}

propertyTail -> "." _ Identifier                                    {% (d, l) => new t.PropertyExpression(null, d[2], false, l) %}
              | Array                                               {% (d, l) => new t.Subscript(null, d[0].array, false, l) %}
              | nullableProperty                                    {% id %}
              
nullableProperty -> "?" "." _ Identifier                                    {% (d, l) => new t.PropertyExpression(null, d[3], true, l) %}
                  | "?" Array                                               {% (d, l) => new t.Subscript(null, d[1].array, true, l) %}
                  | "(" _ (UnnamedArgumentCall _ "," _ {% id %}):* NamedArgumentCall (_ "," _ ArgumentCall {% nth(3) %}):* _ ")" {% (d, l) => new t.FunctionCall(null, d[2].concat([d[3]]).concat(d[4]), l) %}
                  | Tuple {% (d, l) => new t.FunctionCall(null, d[0].tuple.map(item => new t.ArgumentCall(item)), l) %}

ArgumentCall -> NamedArgumentCall {% id %}
              | UnnamedArgumentCall {% id %}

NamedArgumentCall -> %identifier ":" Expression {% (d, l) => new t.ArgumentCall(d[2], d[0], l) %}

UnnamedArgumentCall -> Expression {% (d, l) => new t.ArgumentCall(d[0], null, l) %}

Literal -> %decimal {% literal %}
         | %integer {% literal %}
         | %string {% literal %}
         | Array {% id %}
         | Dictionary {% id %}
         | Tuple {% id %}
         # v- ok this name is way too long
#          | ImmutableDictionary {% id %}
         | Set {% id %}

Array -> "[" _ "]" {% (d, l) => new t.ArrayNode([], l) %}
       | "[" _ delimited[Expression, _ "," _] _ "]" {% (d, l) => new t.ArrayNode(d[2], l) %}

Dictionary -> "[" _ ":" _ "]" {% (d, l) => new t.Dictionary(new Map(), l) %}
            | "[" _ delimited[Key ":" Expression {% (d, l) => [d[0], d[2]] %}, _ "," _] _ "]" {% (d, l) => new t.Dictionary(new Map(d[2]), l) %}

Tuple -> "(" _ ")" {% (d, l) => new t.Tuple([], l) %}
       | "(" _ Expression "," _ delimited[Expression, _ "," _] _ ")" {% (d, l) => new t.Tuple([d[2]].concat(d[5]), l) %}

ImmutableDictionary -> "(" _ ":" _ ")" {% (d, l) => new t.ImmutableDictionary(new Map(), l) %}
#                      | "(" delimited[Key ":" Expression, ","] ")" {% (d, l) => new t.ImmutableDictionary(new Map(d[1]), l) %}

Set -> "{" _ "}" {% (d, l) => new t.SetNode([], l) %}
     | "{" _ delimited[Expression, _ "," _] _ "}" {% (d, l) => new t.SetNode(d[2], l) %}

Key -> Identifier {% id %}
     | "[" _ Expression _ "]" {% nth(1) %}
     
# Primitiveish Things
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
Is -> BinaryOp[Is, ("is" | "issub"), Comparison] {% id %}
Comparison -> BinaryOp[Comparison, ("==" | "!=" | "<>" | "<=>" | "<=" | ">=" | ">" | "<"), Or]  {% id %}
Or -> BinaryOp[Or, ("||"), And]  {% id %}
And -> BinaryOp[And, ("&&"), Shift]  {% id %}
Shift -> BinaryOp[Shift, ("<<" | ">>"), Sum]  {% id %}
Sum -> BinaryOp[Sum, ("+" | "-"), Product]  {% id %}
Product -> BinaryOp[Product, ("*" | "/"), Power]  {% id %}
Power -> BinaryOpRight[Power, ("**"), Bitwise]  {% id %}
Bitwise -> BinaryOp[Bitwise, ("&" | "|" | "^"), Chain]  {% id %}
Chain -> BinaryOp[Chain, ("~>" | ":>"), Range]  {% id %}
Range -> BinaryOp[Range, (".." | "..."), Cast] {% id %}
Cast -> BinaryOpRight[Cast, ("::"), Prefix] {% id %}
Prefix -> ("-" | "+" | "*" | "**" | "!" | "~") Prefix {% (d, l) => new t.UnaryExpression(d[1], d[0][0].value, l) %}
        | Property {% id %}

## TODO: do we include short-circuit (&& and ||)? if so, how to implement?
## what about assignment
FunctionizedOperator -> "(" (
  "==" | "!=" | "<>" | "<=>" | "<=" | ">=" | ">" | "<" | "<<"
    | ">>" | "+" | "-" | "*" | "/" | "**" | "&" | "|" | "^" | "~>" | ":>"
    | ".." | "..."
) ")" {% (d, l) => new t.FunctionizedOperator(d[1][0].value, l) %}
