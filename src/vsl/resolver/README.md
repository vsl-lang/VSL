# Type Resolver
These are a series of classes and functions which serve to perform type
deduction on `ExpressionStatement`s. Because examples such as these exist:

```swift
var a: T = b
```

where `typeof b is T`, the `T` context is needed to perform the cast. These are
considered as "Context Constriants" which are generate as much as possible, then
one-by-one each is resolved. If ambiguity or no applicable type could be fount
then an error is thrown.

## Process
There are two main processes:

 - Constraints
 - Resolution

each of them has their own workings which are encapsulated. However beacuse the
type resolver functions recursively, only one node at a time, bottom-up is
resolved using a custom post-order traverser. The traverser itself is recursive
and does not have a seperate stack.

### Constraints
A constriant has three states:

 - Requested: A fallback when it was not possible to deduct using desired traits
 - Desired: A trait which must be satisfied

A rough overview of the constraints are available in 'constraintType'

As the bottom-up recursion goes, the subclass can "negotiate" the type with the
parent by specifiying attempts and recieing the possibilities, such negotiations
may traverse above the tree and allow the following to be satified:

```swift
func f(a: Int) -> String { ... }
func f(a: Double) -> Int { ... }

let a: String = f(a: f(a: 5))
```

which resolved by:

```
 1       | f(a: 5)      | Int, Double
 |- 2    | a: f(...)    | Int, Double
    |- 3 | f(a: f(...)) | String(Int)
    |- 2 | a: f(...)    | Int
    |- 1 | f(...)       | Int(Double)
```

Now `a: 5` can be determined to be `f(a: 5 as Int)`.

## Expression Node Types
There is a differentiation between two types in an expression:

 - Atomic types
 - Complex types

Atomic types only need one non-conflicting constraint to be specified.
