## Important Things
- [ ] `foo.bar` command chains
- [ ] `T< integer >`-style expressions in types
- [ ] Typealiases throw error
- [ ] `//` Comments bork

## Feature List
- [x] property/subscript
- [x] Binary operator
- [x] Unary operator
- [x] Functionized operator
- [x] Arglists
- [x] Function
- [ ] regex
- [x] complex literal types: array, tuple, set, dictionary, closure (function without arglist)
- [x] write core functions in vsl e.g. `if`/`else`, `for`, `while`/``do_while`/`do <body> while <condition>`
- [ ] list + dictionary comprehensions
- [x] function flags + decorators (do the same thing)
- [x] Method calls
- [x] Command chains

## Validation
- [ ] Validate `public` top-level exports are deterministic structs.
- [x] Ensure no lone literals
- [ ] Warn values w/ return (non-voided) when lone
- [ ] Ensure no mixed top-level expressions with `func main` (include in decl.)
- [ ]

## Miscellaneous things, low priority
- [x] use `readFile` from `fs-promise` again, for some reason readFile bork
- [x] Don't use strings for constant tokens
- [ ] Since nearley does not give sufficient info, create lexemes that match incorrect grammar and return an ErrorNode or something with details
- [x] Fork nearley and make generated js (BUT only do this after the major update)
