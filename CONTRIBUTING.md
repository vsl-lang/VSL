# Contributing
By contibuting to this project, you agree to abide by the thoughtbot [Code of Conduct](https://thoughtbot.com/open-source-code-of-conduct).

## Formatting code
* Use 4 wide soft tabs.
* Put a semicolon at the end of each line.
* Curly braces follow [Java Style](https://en.wikipedia.org/wiki/Indent_style#Variant:_Java).
* Names for classes are in `PascalCase`, while functions, variables, etc. names are in `camelCase`.

## Commits
* Commit early and often. You can squash it all later when you get ready to push to `origin`.
* Titles should be capitalized, 50 characters long, and written in the imperatave mood. It should be `Fix bug`, not `Fixed bug`.
* Titles should be brief and informative, with no punctuation at the end.
* The title should be prefixed by a category (e.g. `generator`, `grammar`, etc) and a colon so it's easier to read a list of commit titles.
* Descriptions should be detailed, especially when squashing multiple commits,  but not too verbose.
* Descriptions should be one paragraph per line, each separated by two line feeds. There is no limit on the length of a line.
* Descriptions are written in the past tense usually.
* It's recommended to sign your commits with your GPG key if you have one. If you don't then that's fine too.
Example commit message:
```
documentation: Add CONTRIBUTING.md

Providing a guideline for contributing can help with maintaining consistency throughout the repo. I added a CONTRIBUTING.md to further promote that.

Because of this, some things in the source code may need to be changed to satisfy this, but obviously not our current commit messages because that would take too long.
```

## Branching
* Always create your branches from `develop` or any other branch based on `develop`.
* Use pull requests to merge branches. Always request merges into `develop`.
* When doing any merging into `develop` (adding a feature, bugfix, etc), merge using the `--squash` flag onto `develop`, or something equivalent to that in a pull request. This lets you create a nice descriptive commit message representing the entire branch you just merged.
* Pull requests should be used for any features or significant changes so they're easier to track, get feedback on, etc.
* Once that branch is merged, it should be deleted to avoid pollution.
* Branch names, if they get published to `origin`,  should be prefixed by what type of branch it is (`feature`, `hotfix`, `bugfix`, etc) and a `/`. The rest of the name is a very brief `kebab-case` name in the imperative mood, e.g. `documentation/add-contributing-guidelines`.
