# VSL - Primary Parser
@{%
"use strict";
let util = require('util');
let t = require('./nodes').default;
let VSLTokenizer = require('./vsltokenizer').default;
let ParserError = require('./parserError').default;
let Scope = require('../scope/scope').default;
let lexer = new VSLTokenizer();

const NodeTypes = require('./vsltokentype').default,
  freeze = Object.freeze,
  integer = freeze({ test: x => x[1] === NodeTypes.Integer }),
  decimal = freeze({ test: x => x[1] === NodeTypes.Decimal }),
  regex = freeze({ test: x => x[1] === NodeTypes.Regex }),
  string = freeze({ test: x => x[1] === NodeTypes.String }),
  identifier = freeze({ test: x => x[1] === NodeTypes.Identifier }),
  special_loop = freeze({ test: x => x[1] === NodeTypes.SpecialArgument }),
  special_identifier = freeze({ test: x => x[1] === NodeTypes.SpecialIdentifier }),
  importStatement = freeze({ test: x => x[1] === NodeTypes.ImportStatement }),
  byteSequence = freeze({ test: x => x[1] === NodeTypes.ByteSequence }),
  boolean = freeze({ test: x => x[1] === NodeTypes.Boolean }),
  nil = freeze({ test: x => x[1] === NodeTypes.Nil }),
  comment = freeze({ test: x => x[1] === NodeTypes.Comment }),
  not_paren = freeze({ test: x => !/^[()]$/.test(x.value || "") }),
  any = freeze({ test: () => true }),
  unwrap = d => d[0].value,
  rewrap = d => [d[0]],
  mid = d => d[0][0],
  retNull = () => null,
  flatten = d => [].concat(...d),
  importMark = Symbol('import');

// custom errors for error prods.
const unlessErr = (message, char) =>
    (data, location, reject) => {
        if (data[0].value === char) return reject;
        else throw new ParserError(message, location)
    };

const err = (message, node) => { throw new ParserError(message, node); }

const unlessNodeErr = (message, node, pos = 0) =>
    (data, location, reject) => {
        if (node.test(data[pos])) return reject;
        else throw new ParserError(message, location)
    };

// State management
let state = {
    inFunction: false,
    inInit: false,
    inGetter: false,
};

const onlyState = (stateName, callback) =>
    (data, location, reject) => {
        if (stateName instanceof Array) {
            for (let i = 0; i < stateName.length; i++) {
                if (state[stateName[i]]) {
                    return callback(data, location, reject);
                }
            }

            return reject;
        } else {
            return state[stateName] ? callback(data, location, reject) : reject;
        }
    }

const setState = (stateName, value) =>
    (data, location, reject) => {
        if (stateName instanceof Array) {
            for (let i = 0; i < stateName.length; i++) {
                state[stateName[i]] = value;
            }
        } else {
            state[stateName] = value;
        }
        return data[0];
    }
%}

@lexer lexer
@split false
@has false

@builtin "postprocessors.ne"

CodeBlock[s]
   -> separator:* ($s (separator:+ $s {% flatten %}):* separator:* {% flatten %}):? {%
                (data, location) => {
                    let statements = [];
                    let items = data[0].concat(...(data[1] || []));
                    let lastComments = [];

                    // Go throguh each statement and take the comments and add
                    // them to the next statement
                    for (let i = 0; i < items.length; i++) {
                        if (items[i] instanceof t.Node) {
                            if (items[i] instanceof t.Comment) {
                                lastComments.push(items[i]);
                            } else {
                                items[i].precedingComments = lastComments;
                                statements.push(items[i]);
                                lastComments = [];
                            }
                        }
                    }
                    return new t.CodeBlock(statements, location)
                }
    %}

main
   -> CodeBlock[(statement {% id %} | ImportStatement {% id %}) {% id %}] {%
        data => {
            for (let i = data[0].statements.length - 1; i >= 0; i--) {
                if (data[0].statements[i] instanceof t.ImportStatement) {
                    data[0].lazyHooks.push(data[0].statements[i]);
                    data[0].statements.splice(i, 1);
                }
            }

            data[0].rootScope = true;
            data[0].scope = new Scope();

            return data[0];
        }
    %}

separator
   -> ";" {% retNull %}
    | "\n" {% retNull %}
    | Comment {% id %}

ImportStatement
   -> %importStatement {% (d, l) => new t.ImportStatement(d[0][0], l) %}

statement
   -> ClassStatement       {% id %}
    | InterfaceStatement   {% id %}
    | EnumerationStatement {% id %}
    | IfStatement          {% id %}
    | ForStatement         {% id %}
    | SwitchStatement      {% id %}
    | WhileStatement       {% id %}
    | DoWhileStatement     {% id %}
    | AssignmentStatement  {% id %}
    | FunctionStatement    {% id %}
    | BlockExpression      {% id %}
    | TypeAlias            {% id %}
    | InitCallStatement    {% onlyState('inInit', id) %}
    | ReturnStatement      {% onlyState(['inFunction', 'inGetter'], id) %}
    | YieldStatement      {% onlyState('inFunction', id) %}

# ============================================================================ #
#                                Control Flow                                  #
# ============================================================================ #

CodeBlockBody
   -> "{" CodeBlock[statement {% id %}] "}" {% nth(1) %}
    | statement {% (d, l, f) => d[0] instanceof t.CodeBlock ? f : d[0] %}
    | ":" statement {% (d, l) => new t.CodeBlock([d[1]], l) %}

IfStatement
   -> "if" _ InlineExpression _ CodeBlockBody (
        _ "else" _ (
            CodeBlockBody {% id %}
        ) {% nth(3) %}
    ):? {% (d, l) => new t.IfStatement(d[2], d[4], d[5], l) %}

SwitchStatement
   -> "switch" _ InlineExpression _ "{" CodeBlock[SwitchCase {% id %}] "}" {% (d, l) => new t.SwitchStatement(d[2], d[5], l) %}

SwitchCase
   -> "case" _ InlineExpression _ SwitchBody {% (d, l) => new t.SwitchCase(d[2], d[4], l) %}
    | "default" _ SwitchBody {% (d, l) => new t.SwitchDefaultCase(d[2], l) %}

SwitchBody
   -> CodeBlockBody {% id %}
    | ":" _ "break" {% (d, l) => new t.CodeBlock([], l) %}

ForStatement
   -> "for" _ ForParameters _ "in" _ InlineExpression _ CodeBlockBody {%
        (d, l) => new t.ForStatement(d[2], d[6], d[8], l)
    %}

ForParameters
   -> delimited[ForParameter {% id %}, _ "," _] {% id %}

ForParameter
   -> Identifier {% id %}

WhileStatement
   -> "while" _ InlineExpression _ CodeBlockBody {%
        (d, l) => new t.WhileStatement(d[2], d[4], l)
    %}

DoWhileStatement
   -> "do" _ "{" CodeBlock[statement {% id %}] "}" _ "while" _ InlineExpression {%
        (d, l) => new t.DoWhileStatement(d[8], d[3], l)
    %}

ReturnStatement
   -> "return" (_ BlockExpression {% nth(1) %}):? {%
       (data, location) => new t.ReturnStatement(data[1], location)
   %}

YieldStatement
  -> "yield" _ BlockExpression {%
      (data, location) => new t.YieldStatement(data[2], location)
  %}

# ============================================================================ #
#                                 Enumerations                                 #
# ============================================================================ #
EnumerationStatement
   -> Annotations Modifier "enum" _ Identifier _ "{" EnumerationItems "}" {%
        (d, l) => new t.EnumerationStatement(
           d[1], // Access
           d[4], // Name
           d[7], // Statements
           d[0], // Annotations
           l
        )
   %}

EnumerationItems
   -> CodeBlock[EnumerationItem {% id %}] {% id %}

EnumerationItem
   -> "case" _ Identifier {% (d, l) => new t.EnumerationCase(d[2], l) %}
    | FunctionStatement {% id %}
    | Field {% id %}

# ============================================================================ #
#                            Classes and Interfaces                            #
# ============================================================================ #

# TODO: add _ after Modifier if it doesnt cause ambiguities

ClassStatement
   -> Annotations Modifier "class" _ Identifier (_ genericDeclaration {% nth(1) %}):? _ (":" _ ExtensionList _
            {% nth(2) %}):? "{" ClassItems "}" {%
        (d, l) => new t.ClassStatement(
            d[1], // access
            d[4], // name
            d[5] || [], // generics
            d[7], // superclasses
            d[9], // statements
            d[0], // annotations
            l // location
        )
    %}

InterfaceStatement
   -> Annotations Modifier "interface" _ Identifier (_ genericDeclaration {% nth(1) %}):? _ (":" _
            ExtensionList _ {% nth(2) %}):? "{" InterfaceItems "}" {%
        (d, l) => new t.InterfaceStatement(
            d[1], // access
            d[4], // name
            d[5] || [], // generics
            d[7], // superclasses
            d[9], // statements
            d[0], // annotations
            l // location
        )
    %}

InitCallStatement
   -> SelfOrSuper _ "." _ "init" _ (
         "(" _ delimited[InitCallArgument {% id %}, _ "," _] _ ")" {% nth(2) %}
       | "(" _ ")" {% () => [] %}
       | %any {% unlessErr("expected initalizer argument list", "(") %}
    ) {% (d, l) => new t.InitDelegationCall(d[0], d[6], l) %}

InitCallArgument
   -> Identifier _ ":" _ InlineExpression {% (d, l) => new t.ArgumentCall(d[4], d[0], l) %}
    | InlineExpression {% (d, l) => new t.ArgumentCall(d[0], null, l) %}

SelfOrSuper
   -> "self" {% (d, l) => new t.Self(l) %}
    | "super" {% (d, l) => new t.Super(l) %}

#TODO: can enums even multiple inherit? of course we need to allow inheritance for Byte, Short etc

# EnumerationStatement
#    -> Annotations Modifier "enumeration" _ Identifier _ (":" _ ExtensionList _
#             {% nth(2) %}):? "{" EnumerationItems ClassItems "}" {%
#         (d, l) => new t.EnumerationStatement(d[1], d[4], d[6], d[8], d[9], d[0], l)
#     %}

Annotations
   -> (Annotation _ {% id %}):* {% id %}

Annotation
   -> "@" %identifier ("(" _ delimited[AnnotationValue {% id %}, _ "," _] _
        ")" {% nth(2) %}):? {%
        (data, location) => new t.Annotation(data[1][0], data[2] || [], location)
    %}
AnnotationValue
   -> %identifier {% mid %}
    | %string {% mid %}
    | %integer {% mid %}
    | %boolean {% mid %}
    | "*" {% unwrap %}
    | "nil" {% unwrap %}

ExtensionList
   -> delimited[constructableType {% id %}, _ "," _] {% id %}

ClassItems
   -> CodeBlock[ClassItem {% id %}] {% id %}

ClassItem
   -> InitializerStatement {% id %}
    | DeinitializerStatement {% id %}
    | FunctionStatement {% id %}
    | Field {% id %}
    | DynamicField {% id %}

Field
   -> AssignmentStatement {%
        (data, location) =>
            new t.FieldStatement(data[0].access, data[0].type, data[0].name,
                data[0].value, data[0].isLazy, location)
    %}

DynamicField
   -> Modifier "let" _ TypedIdentifier _ (
        ("{" {% setState('inGetter', true) %})
        CodeBlock[statement {% id %}]
        ("}" {% setState('inGetter', false) %}) {%
           (data, location, reject) => {
               if (data[1].statements.length > 0) {
                   return [new t.Getter(data[1], location)];
               } else {
                   return reject;
               }
           }
        %} |

       "{" CodeBlock[GetterSetter {% id %}] "}"  {% (data) => data[1].statements %}
    ) {%
        (data, location) => new t.DynamicFieldStatement(data[0], data[3], data[5], location)
    %}

GetterSetter
   -> Getter {% id %}
    | Setter {% id %}

Getter
   -> "get" _
        ("{" {% setState('inGetter', true) %})
        CodeBlock[statement {% id %}]
        ("}" {% setState('inGetter', false) %})
        {%
        (data, location) => new t.Getter(data[3], location)
   %}

Setter
  -> "set" _ "(" _ Identifier _ ")" _ "{" CodeBlock[statement {% id %}] "}" {%
        (data, location) => new t.Setter(data[4], data[9], location)
    %}

InitializerStatement
   -> (AccessModifier _ {% id %}):? "init" "?":? _ ArgumentList _ (
        ( "{" {% setState('inInit', true) %} )
        CodeBlock[statement {% id %}]
        ( "}" {% setState('inInit', false) %} ) {% nth(1) %}
    ) {%
        (data, location) =>
            new t.InitializerStatement(data[0] ? data[0].value : "", !!data[2],
                data[4], data[6], location)
    %}

DeinitializerStatement
   -> "deinit" _ (
        "{" CodeBlock[statement {% id %}] "}" {% nth(1) %}
        | ExternalMarker {% id %}
        | NativeBlock {% id %}
    ) {%
        (data, location) =>
            new t.DeinitializerStatement(data[2], location)
    %}

InterfaceItems
   -> CodeBlock[InterfaceItem {% id %}] {% id %}

InterfaceItem
   -> FunctionHead {% id %}


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
   -> Modifier "lazy":? AssignmentType _ TypedIdentifier (
          _ "=" _ InlineExpression {% nth(3) %}
        | ExternalMarker {% id %}
    ):? {%
        (data, location, reject) => {
            // Don't allow in functions
            const contextWhereNoModifiersAllowed = state.inFunction === true || state.inInit === true;
            const isScopeModifier = data[0].length > 0;
            const isLazyModifier = !!data[1];
            const isModifier = isScopeModifier || isLazyModifier;
            if (contextWhereNoModifiersAllowed && isModifier) {
                err(
                    `Cannot use access modifiers with assignment in this context`,
                    location
                );
            }
            return new t.AssignmentStatement(data[0], assignmentTypes[data[2].value], data[4],
                data[5], !!data[1], location)
        } %}
    | AssignmentType _ %any {% unlessNodeErr('expected identifier after assignment', identifier, 2) %}

AssignmentType
   -> "const" {% id %}
    | "let" {% id %}

# ============================================================================ #
#                                  Functions                                   #
# ============================================================================ #

FunctionStatement
   -> FunctionHead _ FunctionBody {%
        data => {
            data[0].statements = data[2];
            return data[0];
        }
    %}

FunctionHead
   -> Annotations "override":? Modifier
        (
            "function" Identifier {% nth(1) %} |
            "function" OverridableOperator {% nth(1) %} |
            SubscriptToken {% id %}
        )
        ArgumentList
        (_ ("->" {% id %} | "yields" {% id %}) _ type {% (data) => [data[1], data[3]] %}):? {%
        (data, location) =>
            new t.FunctionStatement(data[0], data[2], data[3],
                data[4], data[5]?.[1] || null, data[5]?.[0] === 'yields', !!data[1], null, location)
    %}

OverridableOperator
   -> ("+" | "-" | "*" | "/" | "\\" | "%" | "&" | "^" | "|" | "**" | "<" | ">" |
        "<<" | ">>" | ">>>" | "<=" | ">=" | "==" | "!=" | "!" | "~") {%
        (data, location) =>
            new t.OperatorName(data[0][0].value, location)
    %}

ArgumentList
   -> "(" _ (delimited[Argument {% id %}, _ "," _] _ {% id %}):? ")" {%
        (data) =>
            data[2] || []
        %}

Argument
   -> (Identifier _ {% id %}):? TypedIdentifier ( _ "=" _ InlineExpression {% nth(3) %}):? {%
        (data, location) => new t.FunctionArgument(data[0], data[1], data[2], location)
    %}

FunctionBody
   -> ("{" {% setState('inFunction', true) %})
      (CodeBlock[statement {% id %}] {% id %})
      ("}" {% setState('inFunction', false) %}) {% nth(1) %}
    | ExternalMarker {% id %}
    | NativeBlock {% id %}

NativeBlock
   -> "native" _ "(" _ Identifier _ ")" {%
        (data, location) => new t.NativeBlock(data[4].value, location) %}
    | "native" _ "(" _ %any {% unlessNodeErr(`Native block argument must be identifier`, identifier, 4) %}

ExternalMarker
   -> "external" "(" ( %identifier {% mid %} | %string {% mid %}) ")" {%
       (data, location) => new t.ExternalMarker(data[2], location)
    %}

# ============================================================================ #
#                                 Expressions                                  #
# ============================================================================ #

BinaryOp[self, ops, next]
   -> $self _ $ops _ $next {%
        (data, location) =>
            new t.BinaryExpression(data[0][0], data[4][0], data[2][0][0].value, location)
    %}
    | $next {% mid %}

BinaryOpLeft[self, ops, next, else]
   -> $self _ $ops _ $next {%
        (data, location) =>
            new t.BinaryExpression(data[0][0], data[4][0], data[2][0][0].value, location)
    %}
    | $else {% mid %}

BinaryOpRight[self, ops, next]
   -> $next _ $ops _ $self {%
        (data, location) =>
            new t.BinaryExpression(data[0][0], data[4][0], data[2][0][0].value, location)
    %}
    | $next {% mid %}


BlockExpression
   -> InlineExpression {% id %}
   | Closure {% id %}
InlineExpression
   -> Ternary {%
        (data, location) => new t.ExpressionStatement(data[0], location)
    %}
Ternary
   -> Assign _ "?" _ Ternary _ ":" _ Ternary {%
        (data, location) => new t.Ternary(data[0], data[4], data[8], location)
    %}
    | Assign {% id %}
Assign
   -> BinaryOpRight[Assign, ("=" | "+=" | "-=" | "*=" | "/=" | "\\=" | "%=" | "&=" | "|=" | "^=" | "**="), Is] {% id %}
Is
   -> BinaryOpLeft[Is, ("is" | "issub"), type, Or] {% id %}
Or
   -> BinaryOp[Or, ("||"), And] {% id %}
And
   -> BinaryOp[And, ("&&"), Comparison] {% id %}
Comparison
   -> BinaryOp[Comparison, ("==" | "!=" | "<>" | "<=>" | "<=" | ">=" | ">" | "<"), Shift]  {% id %}
Shift
   -> BinaryOp[Shift, ("<<" | ">>" | ">>>"), Sum] {% id %}
Sum
   -> BinaryOp[Sum, ("+" | "-"), Product] {% id %}
Product
   -> BinaryOp[Product, ("*" | "/" | "\\" | "%"), Power] {% id %}
Power
   -> BinaryOpRight[Power, ("**"), Bitwise] {% id %}
Bitwise
   -> BinaryOp[Bitwise, ("&" | "|" | "^"), Chain] {% id %}
Chain
   -> BinaryOp[Chain, ("~>" | ":>"), As] {% id %}
As
   -> BinaryOpLeft[As, ("as" | "as!" | "as?"), type, Range] {% id %}
Range
   -> BinaryOp[Range, (".." | "..."), Cast] {% id %}
Cast
   -> BinaryOp[type, ("::"), Prefix] {% id %}
Prefix
   -> ("-" | "+" | "*" | "**" | "!" | "~") Prefix {%
        (data, location) =>
            new t.UnaryExpression(
                data[1],
                data[0][0].value,
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

%}

# === Command Chain === #
Closure
   -> "{" CodeBlock[InlineExpression {% id %}] "}" {% nth(1) %}

# === Properties === #

# above is old property head, below is new, idk how to unwat-ify
# is same wait wat
# yeah crazyguys one just merged lexemes #2 and #3 + restrict a bit
Property
   -> propertyHead (propertyTail {% id %}):* {%
        (data, location) => (data[1].length === 0 ?
            data[0] :
            (data = recursiveProperty(data[0], data[1])))
        %}
    | "?" _ nullableProperty (propertyTail {% nth(1) %}):* {%
        (data, location) =>
            recursiveProperty(new t.Whatever(location), [data[2]].concat(data[3]))
        %}
    | "?" {%
        (data, location) =>
            new t.Whatever(location)
        %}

propertyHead
   -> Identifier             {% id %}
    | SelfOrSuper            {% id %}
    | "(" _ InlineExpression _ ")" {% (d, l) => new t.ExpressionStatement(d[2], l) %}
    | FunctionizedOperator   {% id %}
    | Literal                {% id %}

## TODO: do we include short-circuit (&& and ||)? if so, how to implement?
## what about assignment
FunctionizedOperator
   -> "(" (
       "==" | "!=" | "<>" | "<=>" | "<=" | ">=" | ">" | "<" | "<<" | ">>" |
        "+" | "-" | "*" | "/" | "**" | "&" | "|" | "^" | "~>" | ":>" | ".." |
        "..."
    ) ")" {% (d, l) => new t.FunctionizedOperator(d[1][0].value, l) %}

propertyTail
   -> _ "." _ Identifier {% (d, l) => new t.PropertyExpression(null, d[3], false, l) %}
    | Subscript {% id %}
    | nullableProperty {% id %}

Subscript
   -> "[" _ delimited[SubscriptItem {% id %}, _ "," _] _ "]" {% (d, l) => new t.Subscript(null, d[2], false, l) %}

SubscriptItem
   -> Identifier ":" InlineExpression {% (d, l) => new t.ArgumentCall(d[2].expression, d[0], l) %}
    | InlineExpression {% (d, l) => new t.ArgumentCall(d[0].expression, null, l) %}

# TODO: undeclared struct (uses syntax meant for named tuple) will make this a pain but still need to change
nullableProperty
   -> "?" "." _ Identifier {% (d, l) => new t.PropertyExpression(null, d[3], true, l) %}
    | "?" Subscript        {% nth(1) %}
    | "<" delimited[type {% id %}, _ "," _] ">" {% (d, l) => new t.Generic(null, d[1], l) %}
    | "(" _ (delimited[ArgumentCall {% id %}, _ "," _] _ {% id %}):? ")" {%
            (d, l) => new t.FunctionCall(null, d[2] || [], l)
        %}

ArgumentCall -> NamedArgumentCall   {% id %}
              | UnnamedArgumentCall {% id %}

NamedArgumentCall -> Identifier ":" InlineExpression {% (d, l) => new t.ArgumentCall(d[2].expression, d[0], l) %}

UnnamedArgumentCall -> InlineExpression {% (d, l) => new t.ArgumentCall(d[0].expression, null, l) %}

FunctionCallList
   -> delimited[FunctionCallArgument {% id %}, _ "," _]:? {% (d, l) => new t.FunctionCall(null, d[0] || [], l) %}

FunctionCallArgument
   -> Identifier _ ":" _ InlineExpression {% (d, l) => new t.ArgumentCall(d[4].expression, d[0], l) %}
    | InlineExpression {% (d, l) => new t.ArgumentCall(d[0].expression, null, l) %}

# ============================================================================ #
#                                   Literals                                   #
# ============================================================================ #

@{%
function literal(data, location) {
    return new t.Literal(data[0][0], data[0][1], location);
}
%}

Literal
   -> %decimal      {% literal %}
    | %integer      {% literal %}
    | %string       {% literal %}
    | %byteSequence {% literal %}
    | %regex        {% literal %}
    | %boolean      {% literal %}
    | %nil          {% literal %}
    | Array         {% id %}
    | Dictionary    {% id %}
    | Tuple         {% id %}
    # | Set           {% id %}

Array
   -> "[" _ "]" {%
        (data, location) => new t.ArrayNode([], location)
    %}
    | "[" _ delimited[InlineExpression {% id %}, _ "," _] _ "]" {%
        (data, location) => new t.ArrayNode(data[2], location)
    %}

Dictionary
   -> "[" _ ":" _ "]" {%
        (data, location) => new t.Dictionary(new Map(), location)
    %}
    | "[" _ delimited[InlineExpression _ ":" _ InlineExpression {%
            data => [data[0], data[4]]
        %}, _ "," _] _ "]" {%
        (data, location) => new t.Dictionary(new Map(data[2]), location)
    %}

Tuple
   -> "{"  _ TupleParameter (
        _ "," _ TupleParameter {% nth(3) %}
    ):* _ "}" {%
        (data, location) => {
            const tuple = data[3].concat(data[2]);
            return new t.Tuple(tuple, location);
        }
    %}

TupleParameter
   -> Identifier _ ":" _ InlineExpression {% (d, l) => new t.TupleParameter(d[0], d[4], l) %}

Set
   -> "{" _ "," _ "}" {% (data, location) => new t.SetNode([], location) %}
    | "{" _ InlineExpression _ "," _ (
        delimited[InlineExpression {% id %}, _ "," _] _ {% id %}):? "}" {%
        (data, location) => {
            var set = [data[2]];
            if (data[6])
                set = set.concat(data[6]);
            return new t.SetNode(set, location);
        }
    %}

# ============================================================================ #
#                                Miscellaneous                                 #
# ============================================================================ #

Modifier
   -> AccessModifier:? StateModifier:? {%
        data => data.filter(Boolean).map(i => i.value)
    %}

StateModifier
   -> "static" {% id %}
AccessModifier
   -> "public"    {% id %}
    | "protected" {% id %}
    | "private"   {% id %}
    | "readonly"  {% id %}

@{%
function recursiveType(types, location) {
  for (let i = 1; i < types.length; i++) {
    types[i] = new t.Type(types[i - 1], types[i], false, location);
  }
  return types[types.length - 1];
}
%}


TypedIdentifier
   -> Identifier (_ ":" _ type {% nth(3) %}):? {%
        (data, location) => new t.TypedIdentifier(data[0], data[1], location)
    %}

constructableType
   -> delimited[className {% id  %}, _ "." _] {%
        (data, location) => recursiveType(data[0], location)
    %}

type
   -> constructableType {% id %}
    | TupleType {% id %}

TupleType
   -> "{" _ TupleTypeParameter (_ "," _ TupleTypeParameter {% nth(3) %}):* _ "}" {%
       (data, location) => new t.TupleType(data[3].concat(data[2]), location)
    %}

TupleTypeParameter
   -> Identifier _ ":" _ type {% (d, l) => new t.TupleTypeParameter(d[0], d[4], l) %}

className
   -> Identifier {% id %}
    | Identifier "[" "]" {%
        (data, location) =>
            new t.Generic(new t.Identifier("Array", false, location), [data[0]], location)
        %}
    | Identifier "?" {%
        (data, location) =>
            new t.Generic(new t.Identifier("Optional", false, location), [data[0]], location)
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
   -> Identifier (_ "=" _ type {% nth(3) %}):? {%
        (data, location) => new t.TypeDeclaration(data[0], data[1], location)
       %}

genericDeclaration
   -> "<" _ delimited[typeDeclaration {% id %}, _ "," _] _ ">" {% nth(2) %}

TypeAlias
   -> Modifier "typealias" _ Identifier _ "=" _ type {%
        (data, location) => new t.TypeAlias(data[0], data[3], data[7], location)
    %}

Identifier
   -> %identifier {%
        (data, location) => new t.Identifier(data[0][0], location)
    %}

SubscriptToken
   -> "subscript" {% (data, location) => new t.SubscriptToken(location) %}

_
   -> ("\n" | Comment {% id %}):* {%
            (data, i) => data[0].filter(i => i instanceof t.Comment)
       %}

# TODO: Assignment:
# _ ("=" | ":=" | "<<=" | ">>=" | "+=" | "-=" | "/=" |
     # "*=" | "%=" | "**=" | "&=" | "|=" | "^=") _ Assign {%
     #     (data, location) => new t.AssignmentExpression(data[1][0], data[0], data[3])
     # %}

# ============================================================================ #
#                                Documentation                                 #
# ============================================================================ #

Comment
   -> %comment {%
            (d, l) => new t.Comment(
                d[0][0],
                l
            )
       %}
