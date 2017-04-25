@include "expr.ne"

# Parses assignment statements
Assignment -> ("let" | "const") _ %identifier ( _ "=" Expression ):?
PatternDeclaration -> "func" _ %identifier _ "::" argumentList "=>" type