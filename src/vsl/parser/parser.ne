# VSL - Primary Parser
@{%
let t = require('./nodes');
let lexer = new (require('./vsltokenizer'))();

const NodeTypes = require('./vsltokentype'),
  freeze = Object.freeze,
  integer = freeze({ test: x => x[1] === NodeTypes.Integer }),
  decimal = freeze({ test: x => x[1] === NodeTypes.Decimal }),
  string = freeze({ test: x => x[1] === NodeTypes.String }),
  identifier = freeze({ test: x => x[1] === NodeTypes.Identifier }),
  special_loop = freeze({ test: x => x[1] === NodeTypes.SpecialArgument }),
  special_identifier = freeze({ test: x => x[1] ===
            NodeTypes.SpecialIdentifier }),
  unwrap = d => d[0].value,
  mid = d => d[0][0];
%}

@lexer lexer
@split false
@has false

@builtin "postprocessors.ne"

CodeBlock[s]
   -> seperator:* (delimited[$s {% id %}, seperator:+] seperator:*
            {% id %}):? {%
        (data, location) => new t.CodeBlock(data[1] || [], location)
    %}

main
   -> CodeBlock[statement {% id %}] {%
        data => (data[0].rootScope = true, data[0])
    %}

seperator
   -> ";"
    | "\n"

statement
   -> ClassStatement      {% id %}
    | InterfaceStatement  {% id %}
    | AssignmentStatement {% id %}
    | FunctionStatement   {% id %}
    | Expression          {% id %}

# ============================================================================ #
#                            Classes and Interfaces                            #
# ============================================================================ #

ClassStatement
   -> Annotations Modifier "class" _ classDeclaration _ (":" _ ExtensionList _
            {% nth(2) %}):? "{" ClassItems "}" {%
        (data, location) =>
            new t.ClassStatement(data[1], data[4], data[6], data[8], data[0],
                location)
    %}

InterfaceStatement
   -> Annotations Modifier "interface" _ classDeclaration _ (":" _
            ExtensionList _ {% nth(2) %}):? "{" InterfaceItems "}" {%
        (data, location) =>
            new t.InterfaceStatement(data[1], data[4], data[6], data[8],
                data[0], location)
    %}

Annotations
   -> (Annotation _ {% id %}):* {% id %}
Annotation
   -> "@" %identifier ("(" _ delimited[AnnotationValue {% id %}, _ "," _] _
        ")" {% nth(2) %}):? {%
        (data, location) => new t.Annotation(data[1][0], data[2], location)
    %}
AnnotationValue
   -> %identifier {% mid %}

ExtensionList
   -> delimited[type {% id %}, _ "," _] {% id %}

ClassItems
   -> CodeBlock[ClassItem {% id %}] {% id %}
ClassItem
   -> InterfaceItem {% id %}
    | Field {% id %}

Field
   -> Modifier AssignmentStatement {%
        (data, location) =>
            new t.FieldStatement(data[0], data[1].type, data[1].identifier,
                data[1].value, location)
    %}

InterfaceItems
   -> CodeBlock[InterfaceItem {% id %}] {% id %}
InterfaceItem
   -> FunctionHead {% id %}
    | FunctionStatement {% id %}

# ============================================================================ #
#                             Assignment Statement                             #
# ============================================================================ #

@{%
const assignmentTypes = freeze({
    "var": t.AssignmentType.Variable,
    "let": t.AssignmentType.Constant
});
%}

AssignmentStatement
   -> AssignmentType _ TypedIdentifier ( _ "=" _ Expression {% nth(3) %}):? {%
        (data, location) =>
            new t.AssignmentStatement(assignmentTypes[data[0].value], data[2],
                data[3], location)
    %}

AssignmentType
   -> "var" {% id %}
    | "let" {% id %}

# ============================================================================ #
#                                  Functions                                   #
# ============================================================================ #

FunctionStatement
   -> FunctionHead FunctionBody {%
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

BinaryOperator
   -> ("+" | "-" | "*" | "/" | "%" | "&" | "^" | "|" | "**" | "<" | ">" |
        "<=" | ">=" | "==" | "!=") {% mid %}

FunctionArgumentList
   -> ArgumentList (_ "->" _ type {% nth(3) %}):?

ArgumentList
   -> "(" delimited[Argument {% id %}, _ "," _]:? ")" {% nth(1) %}

Argument
   -> TypedIdentifier ( _ "=" _ Expression {% nth(3) %}):? {%
        (data, location) => new t.FunctionArgument(data[0], data[1], location)
    %}

FunctionBody
   -> "{" (CodeBlock[statement {% id %}] {% id %}) "}" {% nth(1) %}
    | "internal" "(" %identifier ")" {%
        (data, location) => new t.InternalMarker(data[2][0], location)
    %}

# ============================================================================ #
#                                 Expressions                                  #
# ============================================================================ #

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

Expression
   -> Ternary {%
        (data, location) => new t.ExpressionStatement(data[0], location)
    %}
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

# ============================================================================ #
#                                  Properties                                  #
# ============================================================================ #

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
   -> Identifier             {% id %}
    | "(" _ Expression _ ")" {% nth(2) %}
    | FunctionizedOperator   {% id %}
    | Literal                {% id %}

## TODO: do we include short-circuit (&& and ||)? if so, how to implement?
## what about assignment
FunctionizedOperator
   -> "(" ("==" | "!=" | "<>" | "<=>" | "<=" | ">=" | ">" | "<" | "<<" | ">>" |
        "+" | "-" | "*" | "/" | "**" | "&" | "|" | "^" | "~>" | ":>" | ".." |
        "..." | "::") ")" {%
        (data, location) =>
            new t.FunctionizedOperator(data[1][0].value, location)
    %}

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

FunctionCallList
   -> delimited[FunctionCallArgument {% id %}, _ "," _]:? {%
        (data, location) => new t.FunctionCall(null, data[0], location)
    %}

FunctionCallArgument
   -> %identifier _ ":" _ Expression {%
        (data, location) => new t.ArgumentCall(data[4], data[0], location)
    %}
    | Expression {%
        (data, location) => new t.ArgumentCall(data[0], null, location)
    %}

# ============================================================================ #
#                                   Literals                                   #
# ============================================================================ #

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

Set
   -> "{" _ "}" {% (data, location) => new t.SetNode([], location) %}
    | "{" _ delimited[Expression {% id %} , _ "," _]  _ "}" {%
        (data, location) => new t.SetNode(data[2], location)
    %}

# ============================================================================ #
#                                Miscellaneous                                 #
# ============================================================================ #

Modifier
   -> DefinitionModifier:? AccessModifier:? StateModifier:? {%
        data => data.filter(Boolean).map(i => i.value)
    %}

DefinitionModifier
   -> "internal" {% id %}
StateModifier
   -> "static" {% id %}
AccessModifier
   -> "public"    {% id %}
    | "protected" {% id %}
    | "private"   {% id %}
    | "readonly"  {% id %}

TypedIdentifier
   -> Identifier (_ ":" _ type {% nth(3) %}):? {%
        (data, location) => new t.TypedIdentifier(data[0], data[1], location)
    %}
type
   -> delimited[className {% id  %}, _ "." _] "?":? {%
        (data, location) => new t.Type(data[0], !!data[1], location)
    %}
className
   -> Identifier {% id %}
    | Identifier "<" delimited[type {% id %}, _ "," _] ">" {%
        (data, location) => new t.Generic(data[0], data[2], location)
    %}
    # TODO: location is incorrect for inner type
    | Identifier "<" Identifier "<" delimited[type {% id %}, _ "," _] ">>" {%
        (data, location) =>
            new t.Generic(data[0], [new t.Generic(data[2], data[4], location)],
                location)
    %}
    | Identifier "<" delimited[type {% id %}, _ "," _] "," Identifier "<"
        delimited[type {% id %}, _ "," _] ">>" {%
        (data, location) =>
            new t.Generic(data[0], data[2].concat([new t.Generic(data[4],
                            data[6], location)]), location)
    %}

typeDeclaration
   -> delimited[classDeclaration {% id %}, _ "." _] "?":?
        (":" delimited[classDeclaration {% id %}, _ "." _] "?":? {%
            (data, location) =>
                new t.TypeDeclaration(data[1], !!data[2], null, null, location)
        %}):? ("=" delimited[classDeclaration {% id %}, _ "." _] "?":? {%
            (data, location) =>
                new t.TypeDeclaration(data[1], !!data[2], null, null, location)
        %}):? {%
        (data, location) =>
            new t.TypeDeclaration(data[0], !!data[1], data[2], data[3],
                location)
    %}
classDeclaration
   -> Identifier {% id %}
    | Identifier "<" delimited[typeDeclaration {% id %}, _ "," _] ">" {%
        (data, location) => new t.GenericDeclaration(data[0], data[2], location)
    %}
    | Identifier "<" Identifier "<" delimited[typeDeclaration {% id %}, _ "," _]
        ">>" {%
        (data, location) =>
            new t.GenericDeclaration(data[0], [new t.GenericDeclaration(data[2],
                        data[4], location)], location)
    %}
    | Identifier "<" delimited[typeDeclaration {% id %}, _ "," _] ","
        Identifier "<" delimited[typeDeclaration {% id %}, _ "," _] ">>" {%
        (data, location) =>
            new t.GenericDeclaration(data[0], data[2].concat([
                        new t.GenericDeclaration(data[4], data[6],
                            location)]), location)
    %}

Identifier
   -> %identifier {%
        (data, location) => new t.Identifier(data[0][0], location)
    %}

_
   -> "\n":*
