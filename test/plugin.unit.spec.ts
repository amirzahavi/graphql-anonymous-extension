import {GraphQLResolveInfo} from 'graphql';
import {makeExecutableSchema} from 'graphql-tools';
import {AnonymousExtension} from '../src/AnonymousExtension';
import {AnonymousDirective} from '../src/AnonymousDirective';

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

type TestContext = {
    user?: string
};
const authenticationFunc = jest.fn((ctx: TestContext) => ctx.user = 'test_user');
const isAuthFunc = jest.fn(({user}: TestContext) => typeof user !== 'undefined');
beforeEach(() => {
    authenticationFunc.mockClear();
    isAuthFunc.mockClear();
});

test('public query should not call authentication function ', () => {    
    const extension = new AnonymousExtension<TestContext>(authenticationFunc, isAuthFunc);
    extension.willResolveField(null, {}, null, {...defaultGraphQLResolveInfo, fieldName: 'public'});

    expect(authenticationFunc.mock.calls.length).toBe(0);
    expect(isAuthFunc.mock.calls.length).toBe(0);
});

test('private query should call authentication function ', () => {
    const extension = new AnonymousExtension<TestContext>(authenticationFunc, isAuthFunc);
    extension.willResolveField(null, {}, {}, {...defaultGraphQLResolveInfo, fieldName: 'private'});

    expect(authenticationFunc.mock.calls.length).toBe(1);
    expect(authenticationFunc.mock.results[0].value).toBe('test_user');
    expect(isAuthFunc.mock.calls.length).toBe(1);
    expect(authenticationFunc.mock.results[0].value).toBeTruthy();
});

test('private query should call authentication function only once', () => {
    const extension = new AnonymousExtension<TestContext>(authenticationFunc, isAuthFunc);
    extension.willResolveField(null, {}, {}, {...defaultGraphQLResolveInfo, fieldName: 'private'});
    extension.willResolveField(null, {}, {user: 'test_user'}, {...defaultGraphQLResolveInfo, fieldName: 'private'});

    expect(authenticationFunc.mock.calls.length).toBe(1);
    expect(authenticationFunc.mock.results[0].value).toBe('test_user');
    expect(isAuthFunc.mock.calls.length).toBe(2);
});