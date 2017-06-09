Modifier
   -> DefinitionModifier:? AccessModifier:? StateModifier:? {%
        data => data.filter(Boolean).map(i => i.value)
    %}

DefinitionModifier
   -> "internal" {% id %}
StateModifier
   -> "static" {% id %}
AccessModifier
   -> "public"    {% id %}
    | "protected" {% id %}
    | "private"   {% id %}
    | "readonly"  {% id %}
