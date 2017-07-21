## Modules

This handles `module.yml` and provides APIs and utilities for managing modules
and extracting as much information as possible. Reference `module.yml`:

```yaml
name: GoatDetector
description: This automatically detects is a picture is of a goat or a different creature
version: 1.0.0-beta.3

# Specify that we want an executable rather than a library.
target: executable

sources:
 - src/**/*.vsl # Process all VSL files in src/

modules:
 - AnimalDetector:
 	git: git@github.com/bob/animalDetector.git
```
