import {makeExecutableSchema} from 'graphql-tools';;
import AnonymousPlugin from "../src/AnonymousPlugin";
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

test('plugin should not start on IntrospectionQuery', () => {
    const plugin = new AnonymousPlugin(schema, ctx => {});
    const listener = plugin.requestDidStart<TestContext>({
        request: {
            operationName: 'IntrospectionQuery'
        },
        context: {value: ""},
        cache: null
    });
    
    expect(listener).toBeNull();
});

test('plugin should initiate iteself as a listener', () => {
    const plugin = new AnonymousPlugin(schema, ctx => {});
    const listener = plugin.requestDidStart<TestContext>({
        request: {
            operationName: 'query'
        },
        context: {value: ""},
        cache: null
    });
        
    expect(listener).toBe(plugin);
});

test('public query should not call authentication function ', () => {
    const authenticationFunc = jest.fn(ctx => {});
    const plugin = new AnonymousPlugin(schema, authenticationFunc);
    const listener = plugin.requestDidStart<TestContext>({
        request: {
            operationName: 'query'
        },
        context: {value: ""},
        cache: null
    });
            
    if (listener) {
        listener.didResolveOperation({
            operation: {
                kind: "OperationDefinition",
                operation: "query",
                selectionSet: {                    
                    kind: "SelectionSet",
                    selections: [{
                        kind: "Field",
                        name: {
                            kind: "Name",
                            value: "public"
                        }
                    }]
                }
            },
            metrics: null,
            operationName: "",
            request: {},
            context: {value: ""},
            cache: null,
            source: "",
            document: null
        });

        expect(authenticationFunc.mock.calls.length).toBe(0);
    } else {
        fail();
    }
});

test('private query should call authentication function ', () => {
    const authenticationFunc = jest.fn((ctx: TestContext) => ctx.value);
    const plugin = new AnonymousPlugin(schema, authenticationFunc);
    const listener = plugin.requestDidStart<TestContext>({
        request: {
            operationName: 'query'
        },
        context: {value: "test_value"},
        cache: null
    });
            
    if (listener) {
        listener.didResolveOperation({
            operation: {
                kind: "OperationDefinition",
                operation: "query",
                selectionSet: {                    
                    kind: "SelectionSet",
                    selections: [{
                        kind: "Field",
                        name: {
                            kind: "Name",
                            value: "private"
                        }
                    }]
                }
            },
            metrics: null,
            operationName: "",
            request: {},
            context: {value: "test_value"},
            cache: null,
            source: "",
            document: null
        });

        expect(authenticationFunc.mock.calls.length).toBe(1);
        expect(authenticationFunc.mock.results[0].value).toBe('test_value');
    } else {
        fail();
    }
});

test('mix query (public + private) should call authentication function ', () => {
    const authenticationFunc = jest.fn((ctx: TestContext) => ctx.value);
    const plugin = new AnonymousPlugin(schema, authenticationFunc);
    const listener = plugin.requestDidStart<TestContext>({
        request: {
            operationName: 'query'
        },
        context: {value: "test_value"},
        cache: null
    });
            
    if (listener) {
        listener.didResolveOperation({
            operation: {
                kind: "OperationDefinition",
                operation: "query",
                selectionSet: {                    
                    kind: "SelectionSet",
                    selections: [{
                        kind: "Field",
                        name: {
                            kind: "Name",
                            value: "public"
                        }
                    },
                    {
                        kind: "Field",
                        name: {
                            kind: "Name",
                            value: "private"
                        }
                    }]
                }
            },
            metrics: null,
            operationName: "",
            request: {},
            context: {value: "test_value"},
            cache: null,
            source: "",
            document: null
        });

        expect(authenticationFunc.mock.calls.length).toBe(1);
        expect(authenticationFunc.mock.results[0].value).toBe('test_value');
    } else {
        fail();
    }
});