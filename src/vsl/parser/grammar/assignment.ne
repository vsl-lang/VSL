@include "expr.ne"
@include "primitives.ne"

# Parses assignment statements
AssignmentStatement -> AssignmentType _ TypedIdentifier ( _ "=" _ Expression {% nth(3) %}):? {%
    (d, l) => new t.AssignmentStatement(
        d[0] === "const" ? t.AssignmentType.Constant : t.AssignmentType.Variable,
        d[2],
        d[3],
        l
    )
%}

AssignmentType -> "const" {% id %}
                | "let" {% id %}

# PatternDeclaration -> "func" _ %identifier _ "::" argumentList "=>" type
