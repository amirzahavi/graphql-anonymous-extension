import {GraphQLResolveInfo} from 'graphql';
import {GraphQLExtension} from 'graphql-extensions';
import AnonymousDirective from './AnonymousDirective';

export type AnonymousContext = Record<string, any>;

export default class AnonymousExtension implements GraphQLExtension {
    constructor(private authFunc: (ctx: AnonymousContext) => void) {}

   willResolveField<AnonymousContext>(source: any,
    args: { [argName: string]: any },
    context: AnonymousContext,
    info: GraphQLResolveInfo) {
        const schemaFields = info.schema.getQueryType().astNode.fields; 
        const anonymousQueries = schemaFields.filter(f => f.directives.some(d => d.name.value === AnonymousDirective.NAME)).map(f => f.name.value);
        const isAnonymousQuery = anonymousQueries.includes(info.fieldName);
        if (!isAnonymousQuery) {
            this.authFunc(context);
        }
    }
}