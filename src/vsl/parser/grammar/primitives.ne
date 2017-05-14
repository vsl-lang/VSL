# Parses basic primitives

TypedIdentifier -> Identifier (_ ":" _ type {% nth(3) %}):? {% (d, l) => new t.TypedIdentifier(d[0], d[1], l) %}
type -> delimited[className {% id  %}, _ "." _] "?":? {% (d, l) => new t.Type(d[0], !!d[1], l) %}
className -> Identifier {% id %}
  | Identifier "<" delimited[Identifier {% id %}, _ "," _] ">" {% (d, l) => new t.Generic(d[0], d[2]) %}

# Identifier
Identifier -> %identifier {% (d, l) => new t.Identifier(d[0][0], l) %}