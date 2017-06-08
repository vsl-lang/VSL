# VSL - Primary Parser  
# most of the more complicated elements are 
# placed in a different file, or if it is a
# terminal, you'll likely need to check
# parser/ for such information

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

@include "expr.ne"
@include "codeBlock.ne"
@include "ws.ne"
@include "class.ne"
@include "assignment.ne"
@include "function.ne"

main
   -> CodeBlock[statement {% id %}] {%
        data => (data[0].rootScope = true, data[0])
    %}

statement
   -> Expression                             {% id %}
#   | CommandChain                           {% id %}
    | FunctionStatement[statement {% id %}]  {% id %}
    | AssignmentStatement                    {% id %}
    | ClassStatement[statement {% id %}]     {% id %}
    | InterfaceStatement[statement {% id %}] {% id %}
