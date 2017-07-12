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
  rewrap = d => [d[0]],
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
    | IfStatement         {% id %}
    | AssignmentStatement {% id %}
    | FunctionStatement   {% id %}
    | Expression          {% id %}
    | CommandChain        {% id %}
    | TypeAlias           {% id %}

# ============================================================================ #
#                                Control Flow                                  #
# ============================================================================ #

IfStatement
   -> "if" _ Expression _ CodeBlock[statement] (
        _ "else" _ (
            CodeBlock[statement]  {% id %} |
            IfStatement           {% rewrap %}
        ):? {% nth(3) %}
    ) {%
        (data, location) =>
            new t.IfStatement(
                data[2],
                data[4],
                data[5],
                location
            )
    %}

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
        (data, location) => new t.Annotation(data[1][0], data[2], location + 1)
    %}
AnnotationValue
   -> %identifier {% mid %}
    | "*" {% unwrap %}
    | "nil" {% unwrap %}

ExtensionList
   -> delimited[type {% id %}, _ "," _] {% id %}

OnlyGetter
   -> Modifier TypedIdentifier Closure {%
        (data, location) =>
            new t.GetterSetter(
                new t.Getter(data[0], data[1], data[2]), null, location
            )
    %}

ClassItems
   -> CodeBlock[ClassItem {% id %}] {% id %}

ClassItem
   -> InterfaceItem {% id %}
    | InitializerStatement {% id %}

Field
   -> Modifier AssignmentStatement {%
        (data, location) =>
            new t.FieldStatement(data[0], data[1].type, data[1].identifier,
                data[1].value, location)
    %}

InitializerStatement
   -> (AccessModifier _ {% id %}):? "init" "?":? _ ArgumentList _
        CodeBlock[statement {% id %}] {%
        (data, location) =>
            new t.InitializerStatement(data[0] ? data[0].value : "", !!data[2],
                data[4] || [], data[6], location)
    %}

InterfaceItems
   -> CodeBlock[InterfaceItem {% id %}] {% id %}
InterfaceItem
   -> FunctionHead {% id %}
    | FunctionStatement {% id %}
    | Field {% id %}
    | OnlyGetter {% id %}

# ============================================================================ #
#                             Assignment Statement                             #
# ============================================================================ #

@{%
const assignmentTypes = freeze({
    "const": t.AssignmentType.Constant,
    "let": t.AssignmentType.Variable
});
%}

AssignmentStatement
   -> AssignmentType _ TypedIdentifier ( _ "=" _ Expression {% nth(3) %}):? {%
        (data, location) =>
            new t.AssignmentStatement(assignmentTypes[data[0].value], data[2],
                data[3], location)
    %}

AssignmentType
   -> "const" {% id %}
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
   -> Annotations Modifier "function"
        (Identifier {% id %} | OverridableOperator {% id %})
        ArgumentList (_ "->" _ type {% nth(3) %}):? {%
        (data, location) =>
            new t.FunctionStatement(data[0], data[1], data[3],
                data[4], data[5], null, location)
    %}

OverridableOperator
   -> ("+" | "-" | "*" | "/" | "%" | "&" | "^" | "|" | "**" | "<" | ">" |
        "<=" | ">=" | "==" | "!=") {%
        (data, location) =>
            new t.Identifier(data[0][0].value, location)
    %}

ArgumentList
   -> "(" _ (delimited[Argument {% id %}, _ "," _] _ {% id %}):? ")" {%
        (data) =>
            data[2] || []
        %}

Argument
   -> TypedIdentifier ( _ "=" _ Expression {% nth(3) %}):? {%
        (data, location) => new t.FunctionArgument(data[0], data[1], location)
    %}

FunctionBody
   -> "{" (CodeBlock[statement {% id %}] {% id %}) "}" {% nth(1) %}
    | "external" "(" %identifier ")" {%
        (data, location) => new t.ExternalMarker(data[2][0], location)
    %}

# ============================================================================ #
#                                 Expressions                                  #
# ============================================================================ #

BinaryOp[self, ops, next]
   -> $self $ops _ $next {%
        (data, location) =>
            new t.BinaryExpression(data[0][0], data[3][0], data[1][0][0].value,
                data[0][0].isClosure ?
                    (data[0][0].isClosure = false) || true :
                    data[3][0].isClosure ?
                        (data[3][0].isClosure = false) || true :
                        data[0][0] instanceof t.Whatever || data[3][0] instanceof t.Whatever,
                location)
    %}
    | $next {% mid %}
BinaryOpRight[self, ops, next]
   -> $next $ops _ $self {%
        (data, location) =>
            new t.BinaryExpression(data[0][0], data[3][0], data[1][0][0].value,
                data[0][0].isClosure ?
                    (data[0][0].isClosure = false) || true :
                    data[3][0].isClosure ?
                        (data[3][0].isClosure = false) || true :
                        data[0][0] instanceof t.Whatever || data[3][0] instanceof t.Whatever,
                location)
    %}
    | $next {% mid %}



Expression
   -> Ternary {%
        (data, location) => new t.ExpressionStatement(data[0], false, false, location)
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
            new t.UnaryExpression(
                data[1],
                data[0][0].value,
                data[0].isClosure ?
                    (data[0].isClosure = false) || true :
                    data[0] instanceof t.Whatever,
                location
            )
    %}
    | Property {% id %}

# ============================================================================ #
#                                  Properties                                  #
# ============================================================================ #

@{%
function recursiveProperty(head, tail, optional) {
    if (tail.length === 0) {
        return head;
    }
    for (let i = 0; i < tail.length - 1; i++) {
        tail[i + 1].head = tail[i];
    }
    tail[0].head = head;
    tail[tail.length - 1].optional = optional;
    return tail[tail.length - 1];
}

function recursiveCommandChain(head, tail, optional) {
  while (head.head) {
      tail.unshift(head);
      head = head.head;
  }
  if (tail.length === 0)
    return head;
  for (let i = 0, current = tail[0]; i < tail.length - 1; current = tail[++i]) {
    if (tail[i + 1].isClosure) {
      tail[i].isClosure = true;
      tail[i + 1].isClosure = false;
    }
    if (tail[i + 1].arguments && tail[i + 1].arguments.length === 1 && tail[i + 1].arguments[0].value instanceof t.CodeBlock) {
      if (tail[i] instanceof t.PropertyExpression)
        tail[i] = new t.FunctionCall(tail[i].head, [tail[i].tail].concat(tail[i + 1].arguments[0].value));
      else
        tail[i].arguments.push(tail[i + 1].arguments[0].value);
      tail[i + 1] = tail[i];
      i++;
    } else
      tail[i + 1].head = tail[i];
  }
  tail[0].head = head;
  tail[tail.length - 1].optional = optional;
  return tail[tail.length - 1];
}

%}

# === Command Chain === #
CommandChain
   -> Property CommandChainPart:+ {% (d, l) => new t.ExpressionStatement(recursiveCommandChain(d[0], d[1]), false, false, l) %}

Closure
   -> "{" CodeBlock[Expression {% id %}] "}" {%
        (data) => data[1]
    %}

CommandChainPart
   -> (ArgumentCallHead (_ "," _ ArgumentCall {% nth(3) %}):+ {% d => [d[0]].concat(d[1]) %}):? Closure {% (d, l) => new t.FunctionCall(null, (d[0] || []).concat([new t.ArgumentCall(d[1], null, l)]), false, l) %}
    | ArgumentCallHead (_ "," _ ArgumentCall {% nth(3) %}):+ {% (d, l) => new t.FunctionCall(null, [d[0]].concat(d[1]), false, l) %}
    | %identifier ":" Expression {% (d, l, f) => d[2].expression instanceof t.UnaryExpression ? f : new t.ArgumentCall(d[2].expression, d[0], l) %}
    | Expression {%
        (d, l, f) =>
            [
                t.UnaryExpression, t.Tuple, t.SetNode, t.ArrayNode, t.Whatever,
                t.Subscript, t.PropertyExpression
            ].some(type => d[0].expression instanceof type) || (
                d[0].expression instanceof t.ExpressionStatement && d[0].expression.parenthesized
            ) ?
                f :
                d[0].expression instanceof t.Identifier ?
                    new t.PropertyExpression(null, d[0].expression, false, false, l) :
                    new t.FunctionCall(null, [new t.ArgumentCall(d[0], null, l)], false, l)
    %}

ArgumentCallHead
   -> %identifier ":" Expression {%
        (d, l, f) =>
            d[2].expression instanceof t.UnaryExpression ?
            f :
            new t.ArgumentCall(d[2].expression, d[0], l)
        %}
    | Expression {%
        (d, l, f) =>
            d[0].expression instanceof t.UnaryExpression ?
            f :
            new t.ArgumentCall(d[0].expression, null, l)
        %}

# === Properties === #

# above is old property head, below is new, idk how to unwat-ify
# is same wait wat
# yeah crazyguy's one just merged lexemes #2 and #3 + restrict a bit
Property
   -> propertyHead (_ propertyTail {% nth(1) %}):* {%
        (data, location) => (data[1].length === 0 ?
            data[0] :
            (data = recursiveProperty(data[0], data[1])))
        %}
    | "?" _ nullableProperty (_ propertyTail {% nth(1) %}):* {%
        (data, location) =>
            recursiveProperty(new t.Whatever(location), [data[2]].concat(data[3]))
        %}
    | "?" {%
        (data, location) =>
            new t.Whatever(location)
        %}

propertyHead
   -> Identifier             {% id %}
    | "(" _ Expression _ ")" {% (d, l) => new t.ExpressionStatement(d[2], false, true, l) %}
    | FunctionizedOperator   {% id %}
    | Literal                {% id %}

## TODO: do we include short-circuit (&& and ||)? if so, how to implement?
## what about assignment
FunctionizedOperator
   -> "(" (
       "==" | "!=" | "<>" | "<=>" | "<=" | ">=" | ">" | "<" | "<<" | ">>" |
        "+" | "-" | "*" | "/" | "**" | "&" | "|" | "^" | "~>" | ":>" | ".." |
        "..." | "::"
    ) ")" {% (d, l) => new t.FunctionizedOperator(d[1][0].value, l) %}

propertyTail
   -> "." _ Identifier {% (d, l) => new t.PropertyExpression(null, d[2], false, l) %}
    | Array {% (d, l) => new t.Subscript(null, d[0].array, false, l) %}
    | nullableProperty {% id %}

# TODO: undeclared struct (uses syntax meant for named tuple) will make this a pain but still need to change
nullableProperty
   -> "?" "." _ Identifier {% (d, l) => new t.PropertyExpression(null, d[3], true, true, l) %}
    | "?" Array            {% (d, l) => new t.Subscript(null, d[0].array, true, l) %}
    # function with at least one named arg
    | "(" _ (UnnamedArgumentCall _ "," _ {% id %}):* NamedArgumentCall (_ "," _ ArgumentCall {% nth(3) %}):* _ ")"
        {% (d, l) => new t.FunctionCall(null, d[2].concat([d[3]]).concat(d[4]), l) %}
    # function with no named args (including empty arglist)
    | Tuple {% (d, l) => new t.FunctionCall(null, d[0].tuple.map(item => new t.ArgumentCall(item)), l) %}
    # function with 1 unnamed arg
    | "(" _ Expression _ ")" {% (d, l) => new t.FunctionCall(null, [new t.ArgumentCall(d[2], d[2].expression.position)], l) %}

ArgumentCall -> NamedArgumentCall   {% id %}
              | UnnamedArgumentCall {% id %}

NamedArgumentCall -> %identifier ":" Expression {% (d, l) => new t.ArgumentCall(d[2].expression, d[0], l) %}

UnnamedArgumentCall -> Expression {% (d, l) => new t.ArgumentCall(d[0].expression, null, l) %}

FunctionCallList
   -> delimited[FunctionCallArgument {% id %}, _ "," _]:? {% (d, l) => new t.FunctionCall(null, d[0] || [], l) %}

FunctionCallArgument
   -> %identifier _ ":" _ Expression {% (d, l) => new t.ArgumentCall(d[4].expression, d[0], l) %}
    | Expression {% (d, l) => new t.ArgumentCall(d[0].expression, null, l) %}

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
            return new t.Tuple(tuple, location);
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
   -> DefinitionModifier:? AccessModifier:? StateModifier:? LazyModifier:? {%
        data => data.filter(Boolean).map(i => i.value)
    %}

DefinitionModifier
   -> "external" {% id %}
StateModifier
   -> "static" {% id %}
AccessModifier
   -> "public"    {% id %}
    | "protected" {% id %}
    | "private"   {% id %}
    | "readonly"  {% id %}
LazyModifier
   -> "lazy" {% id %}


@{%
function recursiveType(types, optional, location) {
  for (let i = 1; i < types.length; i++)
    types[i] = new t.Type(types[i - 1], types[i], false, location);
  types[types.length - 1].optional = optional;
  return types[types.length - 1];
}

function recursiveTypeDeclaration(types, optional, parent, fallback, location) {
  for (let i = 1; i < types.length; i++)
    types[i] = new t.TypeDeclaration(types[i - 1], types[i], false, null, location);
  types[types.length - 1].optional = optional;
  types[types.length - 1].parent = parent;
  types[types.length - 1].fallback = fallback;
  return types[types.length - 1];
}
%}


TypedIdentifier
   -> Identifier (_ ":" _ type {% nth(3) %}):? {%
        (data, location) => new t.TypedIdentifier(data[0], data[1], location)
    %}
type
   -> delimited[className {% id  %}, _ "." _] "?":? {%
        (data, location) => recursiveType(data[0], !!data[1], location)
    %}
className
   -> Identifier {% id %}
    | Identifier "[" "]" {%
        (data, location) =>
            new t.Generic(new t.Identifier("Array", false, location), [data[0]], location)
        %}
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
            new t.Generic(
                data[0],
                data[2].concat([new t.Generic(data[4], data[6], location)]),
                location
            )
    %}

typeDeclaration
   -> delimited[classDeclaration {% id %}, _ "." _] "?":?
        (":" delimited[classDeclaration {% id %}, _ "." _] "?":? {%
            (data, location) =>
                recursiveTypeDeclaration(data[1], !!data[2], null, null, location)
        %}):? ("=" delimited[classDeclaration {% id %}, _ "." _] "?":? {%
            (data, location) =>
                recursiveTypeDeclaration(data[1], !!data[2], null, null, location)
        %}):? {%
        (data, location) =>
            recursiveTypeDeclaration(data[0], !!data[1], data[2], data[3], location)
    %}
classDeclaration
   -> Identifier {% id %}
    | Identifier "<" delimited[typeDeclaration {% id %}, _ "," _] ">" {%
        (data, location) => new t.GenericDeclaration(data[0], data[2], location)
    %}
    | Identifier "<" Identifier "<" delimited[typeDeclaration {% id %}, _ "," _]
        ">>" {%
        (data, location) =>
            new t.GenericDeclaration(
                data[0],
                [new t.GenericDeclaration(data[2], data[4], location)],
                location
            )
    %}
    | Identifier "<" delimited[typeDeclaration {% id %}, _ "," _] ","
        Identifier "<" delimited[typeDeclaration {% id %}, _ "," _] ">>" {%
        (data, location) =>
            new t.GenericDeclaration(
                data[0],
                data[2].concat([new t.GenericDeclaration(data[4], data[6], location)]),
                location
            )
    %}

TypeAlias
   -> Modifier _ "typealias" _ Identifier _ "=" _ type {%
        (data, location) => new t.TypeAlias(data[0], data[4], data[8], location)
    %}

Identifier
   -> %identifier {%
        (data, location) => new t.Identifier(data[0][0], location)
    %}

_
   -> "\n":*
