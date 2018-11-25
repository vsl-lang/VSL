# CHANGELOG
Development progress and changes over time.

## Nov 25, 2018
 - Bug fixes

Plan:
 - Delegating initializers
 - Default parameters
 - enumerations

## Nov 24, 2018
 - Bug fixes

Plan:
 - Start to implement enumerations
   - Definite enum backed by any value (default UInt32)

## Nov 22, 2018
 - Implement new STL methods, operators, etc.
 - Many, many more bugfixes

## Nov 21, 2018
 - Address (Nov 20, 2018 Plan 5)
 - Add backend contextual generic initialization.
 - Add mangling for generic specializations.
 - Adjust `getFunctionName` to support generic function mangling.
 - Modify `ScopeInitItem` for better stringification representation.
 - `CallResolver` now stores contextual return type.
 - Add contextual construction support to `layoutType`
 - Default initializers now support `selfType`.
 - Context propagation
 - Initializers now support deep context propagation
 - Context now also propagates type context.
 - `Function` now supports generics for generic type construction.
 - Static generic methods
 - Support static fields on generic methods
 - Add `Pointer<T>.sizeof()`
 - Add allocation intrinsics
 - A lot more misc bug fixes

Plan:
 1. Implement native initializers (abandoned)
 2. Prohibit generic static fields.
 3. Delegating initializers
 4. Do away with 'prec' types. Only one type with implicit type conversions.

## Nov 20, 2018
 - Implement property negotiation (Nov 19, 2018 Plan 2)
 - Add upward negotiation (Nov 20, 2018 Plan 1)
 - Modify `PropertyResolver` for proper ambiguity resolution.
 - Add `TypeContext` stringification and propogation.
 - Support laying out generic types.
 - Address (Nov 20, 2018 Plan 4)
 - Refactor initializers.
 - Make functions so backendRefs are used.
 - Fix bug where global variables would be declared as constants.

Plan:
 1. Need to figure out upwards negotiation
 2. Do we need upward negotiation for backend?
    1. Should backend have access to type contexts.
 3. Is special behavior needed to compile default inits.
 4. Add mangler to `TypeContext`
 5. Adjust test runner to avoid duplicate stdlib.

## Nov 19, 2018
 - Add `contextualType(TypeContext)` to `GenericParameterItem`
 - Implement (Nov 19, 2018 Plan 4)
 - Implement (Nov 19, 2018 Plan 1)
 - Implement (Nov 19, 2018 Plan 6)

Plan:
 1. ScopeGenericSpecialization probably maybe might need to perhaps maybe be a
    ScopeTypeItem
 2. Other resolve classes probably also need to support generics.
 3. Also need to support method generics.
 4. Change CallResolver to use objects
 5. Verify generic and non-generic functions cannot be mixed with same name
 6. Probably need to de-duplicate `ScopeGenericSpecialization`s

## Nov 12, 2018
 - Add documentation about the different APIs
 - Add `vsl/interop` for creating VSL binary compat items.

## Nov 11, 2018
 - Add a `contextualType(TypeContext)` (Nov 4, 2017 Plan 2.5)
    - This allows resolving generics in context.

Plan:
 1. Differentiate between explicit and implicit `castableTo`.

## Nov 10, 2018
 1. Added constraint which specifies whether an expression can return multiple
    candidates. This allows lower-level errors to be thrown (Nov 9, 2018 Plan 3)

Plan:
 1. Adjust `CallResolver` to return multiple candidates when applicable.
    1. This may not be needed we'll see.

## Nov 9, 2018
 1. Adjusted `CallResolver` to type deduct in context of function type.

Plan:
 1. Right now if ANY candidate throws error an overall error will be thrown this
   means OVERLOADING WILL NOT WORK. (ADDRESSED)
    1. Planned fix is to make resolvers return empty array if no candidates.
    2. Ambiguity can throw error.
 2. `CallResolver` best candidate can be optimized to not need the second val pass
   if a `pendingTies` array is added.
 3. Add a constraint which specifies that lower-level errors can be thrown

## Nov 8, 2018
 1. Modified call resolver to be able to properly handle metatypes.

Plan:
 1. Modify `CallResolver` to be able to evaluate parameters in the context of the
    function type.

## Nov 4, 2018
 1. Looks like the `GenericParameterItem` is not a `ScopeTypeItem` so when checking
its type such as in an assignment that would fail.

 2. What is removed `ScopeGenericItem` as seemed to be a dupe of `GenericParameterItem`.

 3. Fixed so `GenericParameterItem` conforms to `ScopeTypeItem` which allows generic
params to be used in expressions or type statements.

 4. Removed `GenericInstance` because instead, `ScopeGenericSpecialization( MetaClass(originalClass), originalSpecialization.parameters )` can be used.

 5. Switched `TypeLookup.GenericLookup` to use `ScopeGenericSpecialization`.

Plan:
 1. have the **resolvers** identify GenericSpecialization and work on the source class
   while passing the parameters in context.
 2. The generic context should be like a stack and mismatches are errors.
    1. so as a result all properties, calls etc. should pop this.
    2. calls should re-push the specialization if a parameter is returned.
    3. properties should also re-push the specialization if a parameter is returned.
    4. **No idea** if nested generics would still work but the stack concept to
      my understanding might encounter errors with nested generics.
    5. **`TypeLookup` needs** context/negotiation

Ensure these constraints:
 - Multiple overloads of same generic type
 - Generic types can be matched to their methods for example.
 - Perhaps avoiding deduplication of specializations?

Diagram of how the stack based resolution nature would work

```swift
class B<U> {
    let x: U
}

class A<T> {
    let b: B<T>
}

let a = A<Int>(b:         B<Int>(      x: 1     )             ).b.x
//            | [T: Int]  |     |               |             |       
//                        | []  |               |             |
//                              | [U: Int]      |             |
//                                              | [U: Int]    |
//                                                            | [U: Int T: Int]
//                                                      
```

## Oct 31, 2018
 1. Fixed some bugs in typealias ambiguity and now stores position.
 2. DocGen now does not check output directory if JSON output.

Plan:
  1. Generics need to being wrapped
  2. NEED to be being propagated.
