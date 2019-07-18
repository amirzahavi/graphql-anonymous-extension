import {GraphQLResolveInfo} from 'graphql';
import {makeExecutableSchema} from 'graphql-tools';
import AnonymousExtension from '../src/AnonymousExtension';
import AnonymousDirective from '../src/AnonymousDirective';

type TestContext = {
    value: string
}

const schema = makeExecutableSchema({
    typeDefs: `
        ${AnonymousDirective.DECLARATION}
        type Query {
            private: String!
            public: String! @anonymous
        }
    `,
    resolvers: {
        Query: {
            private: () => "private",
            public: () => "public"
        }
    },
    schemaDirectives: { anonymous: AnonymousDirective }
});

const defaultGraphQLResolveInfo: GraphQLResolveInfo = {
    fieldName: null,
    schema,
    fieldNodes: null,
    returnType: null,
    parentType: null,
    fragments: null,
    path: null,
    rootValue: null,
    operation: null,
    variableValues: null
};

test('public query should not call authentication function ', () => {
    const authenticationFunc = jest.fn(ctx => {});
    const extension = new AnonymousExtension(authenticationFunc);
    extension.willResolveField<TestContext>(null, {}, null, {...defaultGraphQLResolveInfo, fieldName: 'public'});

    expect(authenticationFunc.mock.calls.length).toBe(0);
});

test('private query should call authentication function ', () => {
    const authenticationFunc = jest.fn((ctx: TestContext) => ctx.value);
    const extension = new AnonymousExtension(authenticationFunc);
    extension.willResolveField<TestContext>(null, {}, {value: 'test_value'}, {...defaultGraphQLResolveInfo, fieldName: 'private'})

    expect(authenticationFunc.mock.calls.length).toBe(1);
    expect(authenticationFunc.mock.results[0].value).toBe('test_value');
});