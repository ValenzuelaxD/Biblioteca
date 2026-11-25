import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { expressMiddleware } from '@as-integrations/express5';
import { connectDB, getApolloServer } from './graphqlApp.js';

await connectDB();
console.log('MongoDB Atlas conectado');
const server = await getApolloServer();

const app = express();
const dir = path.dirname(fileURLToPath(import.meta.url));
app.use('/graphql', cors(), express.json(), expressMiddleware(server));
app.use(express.static(path.join(dir, '..', 'frontend')));

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`GraphQL en http://localhost:${port}/graphql | Frontend en http://localhost:${port}`));
