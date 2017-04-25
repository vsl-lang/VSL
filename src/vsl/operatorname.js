'use strict';

import Operator from './operatortype';

let VSLOperatorNames = Array(Operator.LENGTH);
let OperatorNameLookup = {
    [Operator.None]: '',
    [Operator.Range]: 'Range',
    [Operator.Assign]: 'Assign',
    [Operator.StrictAssign]: 'Strict assign',
    [Operator.LeftShiftEquals]: 'Left shift equals',
    [Operator.RightShiftEquals]: 'Right shift equals',
    [Operator.PlisEquals]: 'Plus equals',
    [Operator.MinusEquals]: 'Minus equals',
    [Operator.DivideEquals]: 'Divide equals',
    [Operator.TimesEquals]: 'Times equals',
    [Operator.ModuloEquals]: 'Modulo equals',
    [Operator.PowerEquals]: 'Power equals',
    [Operator.BitwiseAndEquals]: 'Bitwise and equals',
    [Operator.BitwiseOrEquals]: 'Bitwise or equals',
    [Operator.BitwiseXorEquals]: 'Bitwise xor equals',
    [Operator.Is]: 'Is',
    [Operator.IsSubclass]: 'Is subclass',
    [Operator.Equal]: 'Equal',
    [Operator.NotEqual]: 'Not equal',
    [Operator.Spaceship]: 'Spaceship',
    [Operator.LessThanOrEqual]: 'Less than or equal',
    [Operator.GreaterThanOrEqual]: 'Greater than or equal',
    [Operator.LessThan]: 'Less than',
    [Operator.GreaterThan]: 'Greater than',
    [Operator.LogicalAnd]: 'Logical and',
    [Operator.LogicalOr]: 'Logical or',
    [Operator.LogicalXor]: 'Logical xor',
    [Operator.LogicalNot]: 'Logical not',
    [Operator.LeftShift]: 'Left shift',
    [Operator.RightShift]: 'Right shift',
    [Operator.Plus]: 'Plus',
    [Operator.Minus]: 'Minus',
    [Operator.Divide]: 'Divide',
    [Operator.Times]: 'Times',
    [Operator.Modulo]: 'Modulo',
    [Operator.Power]: 'Power',
    [Operator.BitwiseAnd]: 'Bitwise and',
    [Operator.BitwiseOr]: 'Bitwise or',
    [Operator.BitwiseXor]: 'Bitwise xor',
    [Operator.BitwiseNot]: 'Bitwise not',
    [Operator.Cast]: 'Cast',
    [Operator.Map]: 'Map',
    [Operator.Chain]: 'Chain',
    [Operator.Negate]: 'Negate',
    [Operator.Positive]: 'Positive'
};

for (let key of OperatorNameLookup)
    VSLOperatorNames[key] = OperatorNameLookup[key];

VSLOperatorNames = Object.freeze(VSLOperatorNames);

export default VSLOperatorNames;