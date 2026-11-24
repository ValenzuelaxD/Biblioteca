import 'dotenv/config';
import mongoose from 'mongoose';
import { faker } from '@faker-js/faker/locale/es';
import { Autor, Libro, Usuario, Prestamo, Resena } from './models.js';

const N = 1000;
const cats = ['Novela', 'Ciencia', 'Historia', 'Tecnología', 'Filosofía', 'Arte', 'Matemáticas', 'Poesía', 'Derecho', 'Medicina'];
const editoriales = ['Planeta', 'Alfaguara', 'Fondo de Cultura', 'Pearson', 'McGraw-Hill', 'Anagrama', 'Siglo XXI', 'O\'Reilly', 'Tusquets', 'Cátedra'];
const carreras = ['Ingeniería', 'Derecho', 'Medicina', 'Arquitectura', 'Contaduría', 'Psicología', 'Sistemas', 'Diseño'];
const nac = ['México', 'España', 'Argentina', 'Colombia', 'Chile', 'EE.UU.', 'Francia', 'Reino Unido', 'Alemania', 'Perú'];
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const sust = ['sombra','viento','memoria','tiempo','ciudad','río','silencio','destino','fuego','camino','espejo','laberinto','sueño','tierra','isla','noche','guerra','jardín','verdad','casa','mar','ley','amor','historia','bosque','frontera','ceniza','luz','secreto','soledad'];
const adj = ['perdido','eterno','último','oculto','lejano','azul','antiguo','silencioso','dorado','invisible','prohibido','secreto','verdadero','olvidado'];
const lugares = ['México','Castilla','los Andes','Macondo','la Patagonia','Oaxaca','Buenos Aires','Sevilla','Lima','Madrid','Bogotá','el Caribe'];
const art = (s) => (['casa','noche','ciudad','guerra','historia','tierra','isla','sombra','memoria','verdad','luz','ley','soledad','frontera','ceniza'].includes(s) ? ['La','una'] : ['El','un']);
const concord = (s, a) => (art(s)[0] === 'La' ? a.replace(/o$/, 'a').replace(/(or)$/, '$1a') : a);
const titulo = () => { const s = pick(sust), a = pick(adj), s2 = pick(sust), [A] = art(s); const t = Math.floor(Math.random() * 5);
  return [`${A} ${s} ${concord(s, a)}`, `${A} ${s} de ${pick(lugares)}`, `${A} ${s} y ${art(s2)[0].toLowerCase()} ${s2}`, `Crónica de ${art(s)[1]} ${s} ${concord(s, a)}`, `${A} ${s} de ${art(s2)[0].toLowerCase()} ${s2}`][t]; };
const bio = (n, nac) => `${n} figura entre los autores de ${nac} con obra de ${pick(['narrativa', 'ensayo', 'poesía', 'divulgación científica', 'investigación histórica'])}.`;
const coment = ['Excelente lectura, muy recomendable.','Me pareció interesante pero algo largo.','Un clásico que todos deberían leer.','Muy útil para mis clases.','La edición está en buen estado.','No me gustó el final.','Lo leí en un fin de semana, no pude soltarlo.','Buen material de consulta.','Un poco difícil de seguir al inicio.','Lo volvería a pedir prestado.'];

await mongoose.connect(process.env.MONGODB_URI);
console.log('Conectado a Atlas');
await Promise.all([Autor, Libro, Usuario, Prestamo, Resena].map((m) => m.deleteMany({})));

const autores = await Autor.insertMany(Array.from({ length: N }, () => ({
  nombre: faker.person.fullName(), nacionalidad: pick(nac),
  anioNacimiento: faker.number.int({ min: 1800, max: 1990 }), biografia: '',
})));
await Promise.all(autores.map((a) => Autor.updateOne({ _id: a._id }, { biografia: bio(a.nombre, a.nacionalidad) })));
const libros = await Libro.insertMany(Array.from({ length: N }, () => {
  const autor = pick(autores); const ej = faker.number.int({ min: 1, max: 6 });
  return { titulo: titulo(), isbn: faker.string.numeric(13), autor: autor._id,
    categoria: pick(cats), editorial: pick(editoriales),
    anioPublicacion: faker.number.int({ min: autor.anioNacimiento + 20, max: 2025 }),
    paginas: faker.number.int({ min: 80, max: 900 }), ejemplares: ej, disponibles: faker.number.int({ min: 0, max: ej }) };
}));
const usuarios = await Usuario.insertMany(Array.from({ length: N }, (_, i) => ({
  nombre: faker.person.fullName(), correo: `u${i}.${faker.internet.email().toLowerCase()}`,
  tipo: pick(['estudiante', 'estudiante', 'docente', 'externo']), carrera: pick(carreras),
  activo: Math.random() > 0.1, fechaRegistro: faker.date.past({ years: 6 }),
})));
const prestamos = await Prestamo.insertMany(Array.from({ length: N }, () => {
  const f = faker.date.past({ years: 2 }); const v = new Date(f.getTime() + 14 * 864e5);
  const devuelto = Math.random() > 0.3;
  const dev = devuelto ? new Date(f.getTime() + faker.number.int({ min: 3, max: 30 }) * 864e5) : null;
  const retraso = dev ? Math.max(0, Math.round((dev - v) / 864e5)) : 0;
  const estado = devuelto ? 'devuelto' : (v < new Date() ? 'vencido' : 'activo');
  return { libro: pick(libros)._id, usuario: pick(usuarios)._id, fechaPrestamo: f, fechaVencimiento: v,
    fechaDevolucion: dev, estado, multa: retraso * 5 };
}));
const resenas = await Resena.insertMany(Array.from({ length: N }, () => ({
  libro: pick(libros)._id, usuario: pick(usuarios)._id, calificacion: faker.number.int({ min: 1, max: 5 }),
  comentario: pick(coment), fecha: faker.date.past({ years: 2 }),
})));
console.log({ autores: autores.length, libros: libros.length, usuarios: usuarios.length, prestamos: prestamos.length, resenas: resenas.length });
await mongoose.disconnect();


