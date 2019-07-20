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
        // get query fields
        const queryType = info.schema.getQueryType();        
        const schemaFields = queryType && queryType.astNode ? queryType.astNode.fields : [];
        // get mutation fields
        const mutationType = info.schema.getMutationType();
        const mutationFields = mutationType && mutationType.astNode ? mutationType.astNode.fields : [];
        // merge all fields
        const allFields = [...schemaFields, ...mutationFields];
        // filter fields marked as anonymous
        const anonymousFields = allFields.filter(f => f.directives.some(d => d.name.value === AnonymousDirective.NAME)).map(f => f.name.value);
        // call authFunc if one or more fields are NOT marked as anonymous
        const isAnonymousQuery = anonymousFields.includes(info.fieldName);
        if (!isAnonymousQuery && !this.isAuth(context)) {
            this.authFunc(context);        
        }
    }
}