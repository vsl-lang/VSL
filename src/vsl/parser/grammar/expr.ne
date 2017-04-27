# Parses an expression
# `Expression` may be empty

@{%
const NodeTypes = require('./vsltokentype'),
  freeze = Object.freeze,
  integer = freeze({ test: x => x[1] === NodeTypes.Integer }),
  decimal = freeze({ test: x => x[1] === NodeTypes.Decimal }),
  string = freeze({ test: x => x[1] === NodeTypes.String }),
  identifier = freeze({ test: x => x[1] === NodeTypes.Identifier }),
  mid = d => d[0][0],
  expr = (d, l) => new t.ExpressionStatement(d[0], l);
%}

@builtin "postprocessors.ne"
@include "ws.ne"

CommandChain -> Expression:+ {% (d, l) => new t.CommandChain(d[0], l) %}

Expression -> BinaryExpression {% expr %}

# Properties
Property -> propertyHead (_ propertyTail {% d => d[1] %}):* {% (d, l) => (d[1].length === 0 ? d[0] : new t.PropertyExpression(d[0], d[1], l)) %}

propertyHead -> Literal {% id %} | Identifier {% id %} | "(" _ Expression _ ")" {% (d, l) => d[2] %} | FunctionizedOperator {% id %}
propertyTail -> "." _ Identifier {% d => d[2] %}
  | "[" _ Expression _ "]" {% (d, l) => new t.Subscript(d[2], l) %}

Literal -> (%decimal {% id %} | %integer {% id %} | %string {% id %}) {% (d, l) => new t.Literal(d[0][0], d[0],[1], l) %}

# Types
TypedIdentifier -> Identifier ":" type
type -> delimited[Identifier, _ "." _] "?":?

# Identifier
Identifier -> %identifier {% (d, l) => new t.Identifier(d[0][0], l) %}

# Operators

## Match a generic operator
## This handles whitespace
BinaryOp[self, ops, next] -> $self $ops _ $next {% (d, l) => new t.BinaryExpression(d[0][0], d[3][0], d[1][0][0], l) %} | $next {% mid %}
BinaryOpRight[self, ops, next] -> $next $ops _ $self {% (d, l) => new t.BinaryExpression(d[0][0], d[3][0], d[1][0][0], l) %} | $next {% mid %}

# Top level assignment
BinaryExpression -> Assign {% id %}

Assign -> BinaryOpRight[Assign, ("=" | ":=" | "<<=" | ">>=" | "+=" | "-=" | "/=" | "*=" | "%=" | "**=" | "&=" | " | =" | "^="), Is] {% id %}
Is -> BinaryOp[Is, ("is" | "issub"), Comparison] {% id %}
Comparison -> BinaryOp[Comparison, ("==" | "!=" | "<>" | "<=>" | "<=" | ">=" | ">" | "<"), Or]  {% id %}
Or -> BinaryOp[Or, ("||"), And]  {% id %}
And -> BinaryOp[And, ("&&"), Shift]  {% id %}
Shift -> BinaryOp[Shift, ("<<" | ">>"), Sum]  {% id %}
Sum -> BinaryOp[Sum, ("+" | "-"), Product]  {% id %}
Product -> BinaryOp[Product, ("*" | "/"), Power]  {% id %}
Power -> BinaryOp[Power, ("**"), Bitwise]  {% id %}
Bitwise -> BinaryOp[Bitwise, ("&" | "|" | "^"), Chain]  {% id %}
Chain -> BinaryOp[Chain, ("->" | ":>"), Range]  {% id %}
Range -> Cast (".." | "...") _ Range {% (d, l) => new t.BinaryExpression(d[0], d[3], d[1][0], l) %} | Cast {% id %}
Cast -> BinaryOpRight[Cast, ("::"), Prefix] {% id %}
Prefix -> ("-" | "+" | "*" | "!" | "~") Prefix {% (d, l) => new t.UnaryExpression(d[1], d[0][0], l) %} | Property {% id %}

## TODO: do we include short-circuit (&& and ||)? if so, how to implement?
## what about assignment
FunctionizedOperator -> "(" (
  ==" | "!=" | "<>" | "<=>" | "<=" | ">=" | ">" | "<" | "<<"
    | ">>" | "+" | "-" | "*" | "/" | "**" | "&" | "|" | "^" | "->" | ":>"
    | ".." | "..." | "::"
) ")" {% (d, l) => new t.FunctionizedOperator(d[1][0], l) %}
