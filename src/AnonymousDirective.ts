import {SchemaDirectiveVisitor} from 'graphql-tools';

export default class AnonymousDirective extends SchemaDirectiveVisitor {
    static get DECLARATION() {
        return 'directive @anonymous on FIELD_DEFINITION';
    }    
    visitFieldDefinition(){}
}