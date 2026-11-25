import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import { GraphQLScalarType, Kind } from 'graphql';
import { Autor, Libro, Usuario, Prestamo, Resena } from './models.js';
import { consultas } from './queries.js';

const JSONScalar = new GraphQLScalarType({
  name: 'JSON', serialize: (v) => v, parseValue: (v) => v,
  parseLiteral: (ast) => (ast.kind === Kind.STRING ? ast.value : null),
});

const typeDefs = `#graphql
  scalar JSON
  type Autor { id: ID! nombre: String! nacionalidad: String anioNacimiento: Int biografia: String }
  type Libro { id: ID! titulo: String! isbn: String autor: Autor categoria: String editorial: String anioPublicacion: Int paginas: Int ejemplares: Int disponibles: Int }
  type Usuario { id: ID! nombre: String! correo: String tipo: String carrera: String activo: Boolean }
  type Prestamo { id: ID! libro: Libro usuario: Usuario fechaPrestamo: String fechaVencimiento: String fechaDevolucion: String estado: String multa: Float }
  type Resena { id: ID! libro: Libro usuario: Usuario calificacion: Int comentario: String }
  type Consulta { id: ID! integrante: String! titulo: String! descripcion: String! }
  type Resultado { consulta: Consulta! total: Int! datos: JSON }

  input AutorInput { nombre: String! nacionalidad: String anioNacimiento: Int biografia: String }
  input LibroInput { titulo: String! isbn: String autor: ID! categoria: String editorial: String anioPublicacion: Int paginas: Int ejemplares: Int disponibles: Int }
  input UsuarioInput { nombre: String! correo: String tipo: String carrera: String activo: Boolean }
  input PrestamoInput { libro: ID! usuario: ID! fechaVencimiento: String estado: String multa: Float }

  type Query {
    autores(limite: Int = 50, saltar: Int = 0, buscar: String, nacionalidad: String): [Autor!]!
    totalAutores(buscar: String, nacionalidad: String): Int!
    autor(id: ID!): Autor
    libros(limite: Int = 50, saltar: Int = 0, buscar: String, categoria: String, soloDisponibles: Boolean): [Libro!]!
    totalLibros(buscar: String, categoria: String, soloDisponibles: Boolean): Int!
    libro(id: ID!): Libro
    usuarios(limite: Int = 50, saltar: Int = 0, buscar: String, tipo: String, activo: Boolean): [Usuario!]!
    totalUsuarios(buscar: String, tipo: String, activo: Boolean): Int!
    usuario(id: ID!): Usuario
    prestamos(limite: Int = 50, saltar: Int = 0, estado: String, buscar: String, conMulta: Boolean): [Prestamo!]!
    totalPrestamos(estado: String, buscar: String, conMulta: Boolean): Int!
    prestamo(id: ID!): Prestamo
    resenas(limite: Int = 50): [Resena!]!
    conteos: JSON
    consultas(integrante: String): [Consulta!]!
    ejecutarConsulta(id: ID!): Resultado!
  }

  type Mutation {
    crearAutor(input: AutorInput!): Autor!
    actualizarAutor(id: ID!, input: AutorInput!): Autor
    eliminarAutor(id: ID!): Boolean!
    crearLibro(input: LibroInput!): Libro!
    actualizarLibro(id: ID!, input: LibroInput!): Libro
    eliminarLibro(id: ID!): Boolean!
    crearUsuario(input: UsuarioInput!): Usuario!
    actualizarUsuario(id: ID!, input: UsuarioInput!): Usuario
    eliminarUsuario(id: ID!): Boolean!
    crearPrestamo(input: PrestamoInput!): Prestamo!
    actualizarPrestamo(id: ID!, input: PrestamoInput!): Prestamo
    eliminarPrestamo(id: ID!): Boolean!
  }
`;

const rx = (s) => ({ $regex: s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' });
const lim = (n) => Math.min(Math.max(n || 50, 1), 1000);
const skp = (n) => Math.max(n || 0, 0);
const f = (d) => (d ? new Date(d).toISOString() : null);

const filtroAutores = ({ buscar, nacionalidad }) => {
  const q = {};
  if (buscar) q.$or = [{ nombre: rx(buscar) }, { nacionalidad: rx(buscar) }];
  if (nacionalidad) q.nacionalidad = nacionalidad;
  return q;
};
const filtroLibros = async ({ buscar, categoria, soloDisponibles }) => {
  const q = {};
  if (buscar) {
    const autores = await Autor.find({ nombre: rx(buscar) }).select('_id').exec();
    q.$or = [{ titulo: rx(buscar) }, { isbn: rx(buscar) }, { editorial: rx(buscar) }, { autor: { $in: autores.map((a) => a._id) } }];
  }
  if (categoria) q.categoria = categoria;
  if (soloDisponibles) q.disponibles = { $gt: 0 };
  return q;
};
const filtroUsuarios = ({ buscar, tipo, activo }) => {
  const q = {};
  if (buscar) q.$or = [{ nombre: rx(buscar) }, { correo: rx(buscar) }, { carrera: rx(buscar) }];
  if (tipo) q.tipo = tipo;
  if (typeof activo === 'boolean') q.activo = activo;
  return q;
};
const filtroPrestamos = async ({ estado, buscar, conMulta }) => {
  const q = {};
  if (estado) q.estado = estado;
  if (conMulta) q.multa = { $gt: 0 };
  if (buscar) {
    const [ls, us] = await Promise.all([Libro.find({ titulo: rx(buscar) }).select('_id').exec(), Usuario.find({ nombre: rx(buscar) }).select('_id').exec()]);
    q.$or = [{ libro: { $in: ls.map((x) => x._id) } }, { usuario: { $in: us.map((x) => x._id) } }];
  }
  return q;
};
let cacheConteos = null;
const crud = (M) => ({
  crear: async (_, { input }) => { cacheConteos = null; return M.create(input); },
  actualizar: async (_, { id, input }) => M.findByIdAndUpdate(id, input, { new: true }),
  eliminar: async (_, { id }) => { cacheConteos = null; return !!(await M.findByIdAndDelete(id)); },
});
const ca = crud(Autor), cl = crud(Libro), cu = crud(Usuario), cp = crud(Prestamo);

const resolvers = {
  JSON: JSONScalar,
  Query: {
    autores: (_, args) => Autor.find(filtroAutores(args)).skip(skp(args.saltar)).limit(lim(args.limite)).exec(),
    totalAutores: (_, args) => Autor.countDocuments(filtroAutores(args)).exec(),
    autor: (_, { id }) => Autor.findById(id).exec(),
    libros: async (_, args) => Libro.find(await filtroLibros(args)).populate('autor').skip(skp(args.saltar)).limit(lim(args.limite)).exec(),
    totalLibros: async (_, args) => Libro.countDocuments(await filtroLibros(args)).exec(),
    libro: (_, { id }) => Libro.findById(id).populate('autor').exec(),
    usuarios: (_, args) => Usuario.find(filtroUsuarios(args)).skip(skp(args.saltar)).limit(lim(args.limite)).exec(),
    totalUsuarios: (_, args) => Usuario.countDocuments(filtroUsuarios(args)).exec(),
    usuario: (_, { id }) => Usuario.findById(id).exec(),
    prestamos: async (_, args) => Prestamo.find(await filtroPrestamos(args)).sort({ fechaPrestamo: -1 }).skip(skp(args.saltar)).limit(lim(args.limite)).populate('libro').populate('usuario').exec(),
    totalPrestamos: async (_, args) => Prestamo.countDocuments(await filtroPrestamos(args)).exec(),
    prestamo: (_, { id }) => Prestamo.findById(id).populate('libro').populate('usuario').exec(),
    resenas: (_, { limite }) => Resena.find().limit(lim(limite)).populate('libro').populate('usuario').exec(),
    conteos: async () => {
      if (cacheConteos && Date.now() - cacheConteos.t < 30000) return cacheConteos.v;
      const [autores, libros, usuarios, prestamos, resenas] = await Promise.all([
        Autor.estimatedDocumentCount(), Libro.estimatedDocumentCount(), Usuario.estimatedDocumentCount(),
        Prestamo.estimatedDocumentCount(), Resena.estimatedDocumentCount(),
      ]);
      cacheConteos = { t: Date.now(), v: { autores, libros, usuarios, prestamos, resenas } };
      return cacheConteos.v;
    },
    consultas: (_, { integrante }) => consultas.filter((c) => !integrante || c.integrante === integrante),
    ejecutarConsulta: async (_, { id }) => {
      const c = consultas.find((x) => x.id === id);
      if (!c) throw new Error('Consulta no encontrada');
      const datos = await c.modelo.aggregate(c.pipeline());
      return { consulta: c, total: datos.length, datos };
    },
  },
  Mutation: {
    crearAutor: ca.crear, actualizarAutor: ca.actualizar, eliminarAutor: ca.eliminar,
    crearLibro: cl.crear, actualizarLibro: cl.actualizar, eliminarLibro: cl.eliminar,
    crearUsuario: cu.crear, actualizarUsuario: cu.actualizar, eliminarUsuario: cu.eliminar,
    crearPrestamo: cp.crear, actualizarPrestamo: cp.actualizar, eliminarPrestamo: cp.eliminar,
  },
  Libro: { autor: (l) => (l.autor && l.autor.nombre ? l.autor : Autor.findById(l.autor).exec()) },
  Prestamo: {
    libro: (p) => (p.libro && p.libro.titulo ? p.libro : Libro.findById(p.libro).exec()),
    usuario: (p) => (p.usuario && p.usuario.nombre ? p.usuario : Usuario.findById(p.usuario).exec()),
    fechaPrestamo: (p) => f(p.fechaPrestamo), fechaVencimiento: (p) => f(p.fechaVencimiento), fechaDevolucion: (p) => f(p.fechaDevolucion),
  },
  Resena: {
    libro: (r) => (r.libro && r.libro.titulo ? r.libro : Libro.findById(r.libro).exec()),
    usuario: (r) => (r.usuario && r.usuario.nombre ? r.usuario : Usuario.findById(r.usuario).exec()),
  },
};

let dbPromise = null;
export async function connectDB() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (!process.env.MONGODB_URI) {
    throw new Error('Falta la variable de entorno MONGODB_URI');
  }
  if (!dbPromise) {
    dbPromise = mongoose.connect(process.env.MONGODB_URI).catch((err) => {
      dbPromise = null;
      throw err;
    });
  }
  await dbPromise;
  return mongoose.connection;
}

let apolloPromise = null;
export async function getApolloServer() {
  if (!apolloPromise) {
    const server = new ApolloServer({ typeDefs, resolvers });
    apolloPromise = server.start().then(() => server).catch((err) => {
      apolloPromise = null;
      throw err;
    });
  }
  return apolloPromise;
}

let serverlessApp = null;
export async function getServerlessApp() {
  await connectDB();
  if (!serverlessApp) {
    const server = await getApolloServer();
    const app = express();
    app.use(cors(), express.json(), expressMiddleware(server));
    serverlessApp = app;
  }
  return serverlessApp;
}
