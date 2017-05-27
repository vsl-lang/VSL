# Transformations & Traversal

This is potentially one of the most important stages of VSL compilation. VSL
types and such are not directly compatible with ASM types obviously so various
transformations have to be done to resolve inheritance, resolve types, mangling,
operator overloading, construction, dynamic dispatch, static dispatch, etc. etc.

## Processes

So transformation works in two primary parts:

 - Preprocessing
 - Scope Resolution 
 - Transformation

Each of these are defined in `transformers`. The API docs cover specific details
very thoroughly so I encourage you to check those out.