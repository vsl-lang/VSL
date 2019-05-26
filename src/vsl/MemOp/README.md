# VSL Memory Optimizer
This transformation pass analysis the generated VSL tree and determines
appropriate memory optimizations that should take place.

## Terminology
Some of these words I made up and some are existing compiler vernacular:

 - **object**: pointer to heap allocated data
 - **contained**: Something allocated and freed in an identifiable closure
 - **binding**: Something allocated and the responsibility of freeing it is
                assigned to a known location.
 - **uncontained**: To be reassigned in some non-deterministic way
 - **fork**: To _fork_ a function meaning to create a copy of it that handles
             the memory management of its parameters differently. Could also
             apply to adding conditional memory management at runtime
 - **track**: To identify at runtime if a value is a pointer. Generally all
              pointers can be 'tracked' by checking if they are null.

## Process
Initially some basic memory analysis will be done including:

 - Escape analysis of variables
 - Value reference counting (static)
 - Value bound checking

Based on this each value allocated within a function can be identified to be
'contained', or 'binding'. Add

## Globals
Globals are 'tracked' by default but will otherwise be forked depending on if
they are every uncontained.

## External
Passing a pointer to an external function has no effect on RC. If you do which
to change this you can specify in the parameter list:

```swift
func addNew(ptr: managed T) {
    Pointer<T>.offset(by: x).store(ptr)
}
```

What this does is it specifies that the method will be treated as taking control
of the memory of T. Use `managed(self)` to tie lifetime to the containing object.

If normal `managed` is used then `Pointer<T>.managedFree(ptr)` should be used
to have the compiled insert a free intrinsic for the pointer indicating the last
use of the managed value. This does not mean the value will be deallocated if it
is used somewhere else.
