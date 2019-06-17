import express from 'express';
import session from 'express-session';
import uuid from 'uuid/v4';
import passport from 'passport';
import { GraphQLLocalStrategy, buildContext } from 'graphql-passport';
import { ApolloServer } from 'apollo-server-express';
import User from './User';
import typeDefs from './typeDefs';
import resolvers from './resolvers';

const PORT = 4000;
const SESSION_SECRECT = 'bad secret';

passport.use(
  new GraphQLLocalStrategy((email, password, done) => {
    const users = User.getUsers();
    const matchingUser = users.find(user => email === user.email && password === user.password);
    const error = matchingUser ? null : new Error('no matching user');
    done(error, matchingUser);
  }),
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  const users = User.getUsers();
  const matchingUser = users.find(user => user.id === id);
  done(null, matchingUser);
});

const app = express();

app.use(session({
  genid: (req) => uuid(),
  secret: SESSION_SECRECT,
  resave: false,
  saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req, res }) => buildContext({ req, res, User }),
  playground: {
    settings: {
      'request.credentials': 'same-origin',
    },
  },
});

server.applyMiddleware({ app });

app.listen({ port: PORT }, () => {
  console.log(`🚀 Server ready at http://localhost:${PORT}`);
});