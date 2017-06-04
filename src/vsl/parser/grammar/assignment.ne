@include "expr.ne"
@include "primitives.ne"

# Parses assignment statements
AssignmentStatement
   -> AssignmentType _ TypedIdentifier ( _ "=" _ Expression {% nth(3) %}):? {%
        (data, location) => {
            var type;
            if (data[0] === "let") {
                type = t.AssignmentType.Constant;
            } else {
                type = t.AssignmentType.Variable;
            }
            return new t.AssignmentStatement(type, data[2], data[3], location);
        }
    %}

AssignmentType
   -> "var" {% id %}
    | "let" {% id %}

# PatternDeclaration -> "func" _ %identifier _ "::" argumentList "=>" type
