# graphql-anonymous-extension
An apollo-server extension for managing a secure graphql

### Install

```
npm install graphql-anonymous-extension
```

### Usage

By default all queries and mutation are authenticated/authorize by calling the `authFunc`, only when marked with `@anonymous` directive the `authFunc` will not called and let the resolver do it's job.

`authFunc` will be called if one or more queries or mutations **DO NOT** have `@anonymous` directive mark on them

NOTES: 
1. `isAuth` function called before `authFunc` will called to avoid re-authenticate/authorize in the same request for different fields
2. `authFunc` works only with synchronious function

### Example

```javascript
const {ApolloServer, gql, AuthenticationError, ForbiddenError} = require('apollo-server');
const {AnonymousExtension, AnonymousDirective} = require('graphql-anonymous-extension');

const typeDefs = gql`
    ${AnonymousDirective.DECLARATION} # or directive @anonymous on FIELD_DEFINITION
    type Query {
        public: String! @${AnonymousDirective.NAME}    
        private: String!
        private2: String!
    }

    type Mutation {
        changeSecret(secret: String!): String! 
        changeNothing: String! @anonymous
    }
`;

const resolvers = {
    Query: {
        public: () => 'public!',
        private: () => 'private!',
        private2: () => 'private2!'
    },
    Mutation: {
        changeSecret: (parent, {secret}) => `success change secret to ${secret}`,
        changeNothing: () => 'did nothing important'
    }
};

const authenticate = (ctx) => {
    if (!ctx.token)
        throw new AuthenticationError('no token');

    if (ctx.token !== 'p@ssword')
        throw new ForbiddenError('invalid');

    ctx.user = true;
};

const isAuthenticated = (ctx) => ctx.user;

const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({req}) => ({token: req.get('authorization')}),
    extensions: [() => new AnonymousExtension(authenticate, isAuthenticated)]
});

server.listen()
    .then(info => console.log(info.url));
```
