# Parses basic primitives

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
        (data, location) => new t.GenericDeclaration(data[0],
            data[2].concat([new t.GenericDeclaration(data[4], data[6],
                        location)]), location)
    %}

TypeAlias
   -> "typealias" Identifier "=" TypedIdentifier {%
        (data, location) => new t.TypeAlias(data[1], data[3])
    %}

# Identifier
Identifier
   -> %identifier {%
        (data, location) => new t.Identifier(data[0][0], false, location)
    %}
