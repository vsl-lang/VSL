import t from '../parser/nodes';
import * as resolvers from './resolvers';

export default function vslGetChild(from: Node): TypeResolver {
    switch(from.constructor) {
        case t.ExpressionStatement: return new resolvers.RootResolver(from, vslGetChild);
        case t.Identifier: return new resolvers.IdResolver(from, vslGetChild);
        case t.Literal: return new resolvers.LiteralResolver(from, vslGetChild);
        case t.FunctionCall: return new resolvers.CallResolver(from, vslGetChild);
        case t.PropertyExpression: return new resolvers.PropertyResolver(from, vslGetChild);
        case t.Self: return new resolvers.SelfResolver(from, vslGetChild);
        case t.BinaryExpression: return new resolvers.BinaryOperatorResolver(from, vslGetChild);
        case t.Generic: return new resolvers.GenericResolver(from, vslGetChild);
        case t.AssignmentExpression: return new resolvers.AssignmentResolver(from, vslGetChild);
        case t.OrExpression:
        case t.AndExpression: return new resolvers.ShortCircutResolver(from, vslGetChild);
        case t.BitcastExpression: return new resolvers.CastResolver(from, vslGetChild);
        case t.UnaryExpression: return new resolvers.UnaryOperatorResolver(from, vslGetChild);
        default: throw new TypeError(`No deduction child handler for ${from.constructor.name}`);
    }
}
