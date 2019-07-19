import {GraphQLResolveInfo} from 'graphql';
import {GraphQLExtension} from 'graphql-extensions';
import {AnonymousDirective} from './AnonymousDirective';

export type AuthFunction<Context> = (ctx: Context) => void;
export type IsAuthenticatedFunction<Context> = (ctx: Context) => boolean;

export class AnonymousExtension<AnonymousContext> implements GraphQLExtension {
    constructor(
        private authFunc: AuthFunction<AnonymousContext>,
        private isAuth: IsAuthenticatedFunction<AnonymousContext>
    ) {}

   willResolveField(
        source: any,
        args: { [argName: string]: any },
        context: AnonymousContext,
        info: GraphQLResolveInfo
    ) {
        const schemaFields = info.schema.getQueryType().astNode.fields; 
        const anonymousQueries = schemaFields.filter(f => f.directives.some(d => d.name.value === AnonymousDirective.NAME)).map(f => f.name.value);
        const isAnonymousQuery = anonymousQueries.includes(info.fieldName);
        if (!isAnonymousQuery && !this.isAuth(context)) {
            this.authFunc(context);        
        }
    }
}