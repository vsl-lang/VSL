# VSL Utilities

These are various internal utilities which offer helper functions to accomplish
and create various things.

The primary thing offered is AST tools, specifically AST generation/comparison.
Comparing AST children is pretty slow for brach equality and so to avoid
retraversing over and over again to find an applicable branch. We use a
JSON-like representation internally to represent a partial-AST. Think of it as a 
"serialized" version. 

Additionally by passing tokens VSL trees can be manually generated. Use
`makeAST` to create this JSON-IR and then `compIRToAST` to compare the tree.