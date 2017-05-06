Modifier -> DefinitionModifier:? AccessModifier:? StateModifier:? {% d => d.filter(Boolean) %}
DefinitionModifier -> "internal" {% id %}
StateModifier -> "static" {% id %}
AccessModifier -> "public" {% id %} | "private" {% id %} | "readonly" {% id %}