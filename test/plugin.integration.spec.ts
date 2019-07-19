import {ApolloServer, AuthenticationError, makeExecutableSchema} from 'apollo-server';
import {Context} from 'apollo-server-core';
import {AnonymousDirective} from '../src/AnonymousDirective';
import {AnonymousExtension} from '../src/AnonymousExtension';

import ApolloClient, {gql} from 'apollo-boost';
import fetch from 'unfetch';

type TestContext = {
    authorization: string,
    user: {id: number, name: string}
}

let server: ApolloServer = null;

beforeAll(async () => {
    const typeDefs = `
        ${AnonymousDirective.DECLARATION}

        type Query {
            public: String! @anonymous
            private: String! 
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
        
        ctx.user = {id: 1, name: 'test_user'};
    }

    function isAuth({user}: Context<TestContext>) {
        return typeof user !== 'undefined';
    }

    const schema = makeExecutableSchema({typeDefs, resolvers, schemaDirectives: {anonymous: AnonymousDirective}});
    server = new ApolloServer({
        schema,
        context: ({req}) => ({authorization: req.headers.authorization}),
        extensions: [() => new AnonymousExtension(authenticate, isAuth)]
    });

    await server.listen();
});

test('query without authorization header on private query should throw authentication error', async () => {
    const client = new ApolloClient({        
        fetch,
        uri: 'http://localhost:4000'
    });

    const query = gql`
        {
            private
        }
    `;

    await expect(client.query({query}))
            .rejects
            .toThrow();
});

test('query with invalid authorization header on private query should throw authentication error', async () => {
    const client = new ApolloClient({        
        fetch,
        headers: {
            authorization: "invalid"
        },
        uri: 'http://localhost:4000'
    });

    const query = gql`
        {
            private
        }
    `;

    await expect(client.query({query}))
            .rejects
            .toThrow();
});

test('query with valid authorization header on private query should return data', async () => {
    const client = new ApolloClient({        
        fetch,
        headers: {
            authorization: "secret"
        },
        uri: 'http://localhost:4000'
    });

    const query = gql`
        {
            private
        }
    `;

    await expect(client.query({query}))
        .resolves
        .toHaveProperty('data.private', 'private');
});

test('query without authorization header on public query should return data', async () => {
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
        .resolves
        .toHaveProperty('data.public', 'public');
});

test('mix query without authorization header on public+private queries should throw error', async () => {
    const client = new ApolloClient({        
        fetch,
        uri: 'http://localhost:4000'
    });

    const query = gql`
        {
            public
            private
        }
    `;

    await expect(client.query({query}))
        .rejects
        .toThrow();
});