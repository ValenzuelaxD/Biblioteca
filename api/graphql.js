import { getServerlessApp } from '../backend/graphqlApp.js';

export default async function handler(req, res) {
  try {
    const app = await getServerlessApp();
    return app(req, res);
  } catch (err) {
    console.error('Error en /api/graphql:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ errors: [{ message: err.message || 'Error interno del servidor' }] }));
  }
}
