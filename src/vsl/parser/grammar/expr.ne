# Parses an expression
# `Expression` maybe empty

@{%
var t = require('./nodes');
var NodeTypes = require('./vsltokenizer').VSLTokenType;

var integer = { test: x => x[1] === NodeTypes.Integer }
var decimal = { test: x => x[1] === NodeTypes.Decimal }
var string = { test: x => x[1] === NodeTypes.String }
var identifier = { test: x => x[1] === NodeTypes.Identifier }
%}

@include "ws.ne"
@builtin "postprocessors.ne"

Expression -> Property {% id %}

# Properies
Property -> propertyHead (_ propertyTail {% d => d[1] %}):* {% (d, l) => d[1].length === 0 ? d[0] : new t.PropertyExpression(d[0], d[1], l) %}

propertyHead -> Literal {% id %} | Identifier {% id %}
propertyTail -> "." _ Identifier {% d => d[2] %}
    | "[" _ Expression _ "]" {% (d, l) => new t.Subscript(d[2], l) %}

Literal -> (%decimal {% id %} | %integer {% id %} | %string {% id %}) {% (d, l) => new t.Literal(d[0][0], l) %}

# Types
TypedIdentifier -> Identifier ":" type
type -> delimited[Identifier, _ "." _]

# Identifier
Identifier -> %identifier {% (d, l) => new t.Identifier(d[0][0], l) %}