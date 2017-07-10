Modifier -> DefinitionModifier:? AccessModifier:? StateModifier:? LazyModifier:? {% d => d.filter(Boolean).map(i => i.value) %}
DefinitionModifier -> "internal" {% id %}
StateModifier -> "static" {% id %}
AccessModifier -> "public" {% id %}
                | "private" {% id %}
                | "readonly" {% id %}
LazyModifier -> "lazy" {% id %}
