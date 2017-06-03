# Contributing
By contibuting to this project, you agree to abide by the thoughtbot [Code of Conduct](https://thoughtbot.com/open-source-code-of-conduct).

## Formatting code
 * Use 4-wide soft tabs.
 * Semicolons are preffered at the end of statements (except block statements).
 * Curly braces follow [Java Style](https://en.wikipedia.org/wiki/Indent_style#Variant:_Java).
 * Names for classes are in `PascalCase`, functions/fields in `camelCase`, local names in `snek_case`.
 * Prefer double quotes and template strings unless for particularity applied senarios. 

## Commits
 * **Commit early and often**. You can squash it all later when you get ready to push to `origin`.
 * **Sign** your commits (`git commit -s`). If you have a GPG key, use that too (`git commit -sS`)

Summaries:
 * **Capitalize** commit summaries. They should be a max of **50 characters**, no punctuation
 * Write commit summaries in the **imperative**. (e.g. `Fix bug`, not `Fixed bug`)
 * Prefix the summary by a 'category' and a colon (e.g. `fix:`, `generator:`, `grammar:`, etc.)

Descriptons:
 * Limit descriptions to **72ish characters per line**. Seperate paragraphs with two newlines
 * Write your descriptions in the past tense.

Example commit message:
```
documentation: Add CONTRIBUTING.md

Providing a guideline for contributing can help with maintaining consistency
throughout the repo. I added a CONTRIBUTING.md to further promote that.

Because of this, some things in the source code may need to be changed to
satisfy this, but obviously not our current commit messages because that would
take too long.

Signed-off-by: Sir Goat <sirgoatiiv@goatfam.com>
```

We recommend reading:

 - [5 Useful Tips for a Better Commit Message](https://robots.thoughtbot.com/5-useful-tips-for-a-better-commit-message)
 - [A Note About Git Commit Messages](http://tbaggery.com/2008/04/19/a-note-about-git-commit-messages.html)

## Branching
 * Branch from `develop` or one if it's child branches.
 * Always pull request into `develop`.
 * Always squash when merging upstream. (Specify who merged if diff. from PR author)
 * Delete merged branches. Consider GCing orphaned commits with `git gc --prune=now --aggressive`.
 * Branch names on the source repo (i.e. not on forks) should be prefixed by the type of change (`feature`, `hotfix`, `bugfix`) and a `/`. The rest of the name is a very brief `kebab-case` name in the imperative mood, e.g. `documentation/add-contributing-guidelines`.
