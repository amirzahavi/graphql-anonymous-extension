import {GraphQLSchema, FieldNode} from 'graphql';
import {ApolloServerPlugin, GraphQLRequestListener, GraphQLRequestContext} from 'apollo-server-plugin-base';

export type AnonymousContext = Record<string, any>;

export default class AnonymousPlugin implements ApolloServerPlugin, GraphQLRequestListener {
    constructor(private schema: GraphQLSchema, private authFunc: (ctx: AnonymousContext) => void) {}

    requestDidStart<Context>(requestContext: GraphQLRequestContext<Context>): GraphQLRequestListener | void {
        if (requestContext.request.operationName === 'IntrospectionQuery') // skip interospection queries
            return null;
        return this;
    }

    didResolveOperation<Context>({context, operation}: GraphQLRequestContext<Context>) {
        const schemaFields = this.schema.getQueryType().astNode.fields; 
        const anonymousQueries = schemaFields.filter(f => f.directives.some(d => d.name.value === 'anonymous')).map(f => f.name.value);
        const operationFields = operation.selectionSet.selections.filter(s => s.kind === 'Field');
        const isAnonymousQuery = operationFields.every((f: FieldNode) => anonymousQueries.includes(f.name.value));
        if (!isAnonymousQuery) {
            this.authFunc(context);
        }
    }
}