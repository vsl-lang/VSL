# Type Resolver
This is pretty simple compared to other things. This resolves things like:

```
A<U>.B
```

And notifies `A` that it has a new generic pattern `<U>`

`class A<T> {}`

 =>

`class A$U { typealias T = U }`
