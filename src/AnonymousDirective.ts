import {SchemaDirectiveVisitor} from 'graphql-tools';

export default class AnonymousDirective extends SchemaDirectiveVisitor {
    visitFieldDefinition(){}
}