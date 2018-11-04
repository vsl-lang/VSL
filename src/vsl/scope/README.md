## `vsl/scope`

The files here manage the scope chain and the classes that represent the various
types and values in VSL.

### Generics
Generics work in three classes:

 - `GenericInfo`
    - Specifies parameter types, type constraints, etc.
 - `ScopeTypeItem: ScopeTypeItem`
    - Refers to the type _without specialization_. Stores `GenericInfo`
 - `ScopeGenericSpecialization`
    - Refers to the type _with specialization_. Contains the original item and
      info.

When a specialization is referenced, the GenericInfo is released to the expression
resolution context and the contained `ScopeTypeItem` is evaluated upon.

If a `ScopeTypeItem` is received that `isGeneric`. Then contextually the nearest
`ScopeGenericSpecialization` is obtained
