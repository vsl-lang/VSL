# User ASTs

Internally VSL generates ASTs which are not normally representable in code. If
you run `vsl --transformrepl` you can sort of see what exactly is generated. To
be able to actually check transformations however, you'd need some way to
generate these ASTs themselves. ASTs are complex, they have circular references
qualifiers, GC stats, and other important things. Most transformations will trip
up if they lack this data which is why you'd need a tool to make you one.