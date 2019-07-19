import {SchemaDirectiveVisitor} from 'graphql-tools';

export class AnonymousDirective extends SchemaDirectiveVisitor {
    static get DECLARATION() {
        return `directive @${this.NAME} on FIELD_DEFINITION`;
    }
    
    static get NAME() {
        return 'anonymous';
    }
    
    visitFieldDefinition(){}
}