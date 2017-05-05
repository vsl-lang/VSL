# Parses basic primitives

TypedIdentifier -> Identifier (_ ":" _ type {% nth(3) %}):? {% (d, l) => new t.TypedIdentifier(d[0], d[1], l) %}
type -> delimited[Identifier {% id  %}, _ "." _] "?":? {% (d, l) => new t.Type(d[0], !!d[1], l) %}

# Identifier
Identifier -> %identifier {% (d, l) => new t.Identifier(d[0], l) %}