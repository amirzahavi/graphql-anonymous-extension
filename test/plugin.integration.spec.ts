import {ApolloServer, AuthenticationError, makeExecutableSchema} from 'apollo-server';
import {Context} from 'apollo-server-core';
import AnonymousDirective from '../src/AnonymousDirective';
import AnonymousPlugin from '../src/AnonymousPlugin';

import ApolloClient, {gql} from 'apollo-boost';
import fetch from 'unfetch';
import { GraphQLError } from 'graphql';

type TestContext = {
    authorization: string
}

let server: ApolloServer = null;

beforeAll(async () => {
    const typeDefs = `
        ${AnonymousDirective.DECLARATION}

        type Query {
            public: String!
            private: String! @anonymous
        }
    `;

    const resolvers = {
        Query: {
            public: () => 'public',
            private: () => 'private'
        }
    };    

    function authenticate(ctx: Context<TestContext>) {
        if (!ctx.authorization)
            throw new AuthenticationError('authorization header not found');
        
        if (ctx.authorization && ctx.authorization !== 'secret')
            throw new AuthenticationError('invalid');
    }

    const schema = makeExecutableSchema({typeDefs, resolvers, schemaDirectives: {anonymous: AnonymousDirective}});
    server = new ApolloServer({
        schema,
        context: ({req}) => ({authorization: req.headers.authorization}),
        plugins: [new AnonymousPlugin(schema, authenticate)]
    });

    await server.listen();
});

test('query without authorization header on public query should throw authentication error', async () => {
    const client = new ApolloClient({        
        fetch,
        uri: 'http://localhost:4000'
    });

    const query = gql`
        {
            public
        }
    `;

    await expect(client.query({query}))
            .rejects.toThrow();
});