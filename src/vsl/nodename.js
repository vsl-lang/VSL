'use strict';

import Node from './nodetype';

let VSLNodeNames = Array(Node.LENGTH);
let NodeNameLookup = {
    [Node.Base]: '',
    [Node.Regex]: 'Regex',
    [Node.Set]: 'Set',
    [Node.Tuple]: 'Tuple',
    [Node.Array]: 'Array',
    [Node.Dictionary]: 'Dictionary',
    [Node.String]: 'String',
    [Node.Number]: 'Number',
    [Node.KeyValuePair]: 'Key-value pair',
    [Node.KeyValuePairs]: 'Key-value pairs',
    [Node.Data]: '',
    [Node.Call]: 'Call',
    [Node.Subscript]: 'Subscript',
    [Node.VariableDeclaration]: 'Variable declaration',
    [Node.Typed]: 'Typed',
    [Node.PropertySuffix]: 'Property suffix',
    [Node.Property]: 'Property',
    [Node.Declaration]: 'Declaration',
    [Node.Type]: 'Type',
    [Node.Initializer]: 'Initializer',
    [Node.Arguments]: 'Arguments',
    [Node.BinaryExpression]: 'Binary expression',
    [Node.UnaryExpression]: 'Unary expression',
    [Node.Expressions]: 'Expressions',
    [Node.CommandChain]: 'Command chain',
    [Node.Statement]: 'Statement',
    [Node.Function]: 'Function',
    [Node.Program]: 'Program'
};

for (let key of NodeNameLookup)
    VSLNodeNames[key] = NodeNameLookup[key];

VSLNodeNames = Object.freeze(VSLNodeNames);

export default VSLNodeNames;