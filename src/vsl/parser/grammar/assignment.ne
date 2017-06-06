@include "expr.ne"
@include "primitives.ne"

# Parses assignment statements
@{%
const assignmentTypes = {
    "var": t.AssignmentType.Variable,
    "let": t.AssignmentType.Constant
};
%}

AssignmentStatement
   -> AssignmentType _ TypedIdentifier ( _ "=" _ Expression {% nth(3) %}):? {%
        (data, location) =>
            new t.AssignmentStatement(assignmentTypes[data[0]], data[2],
                data[3], location)
    %}

AssignmentType
   -> "var" {% id %}
    | "let" {% id %}

# PatternDeclaration -> "func" _ %identifier _ "::" argumentList "=>" type
