import { Autor, Libro, Usuario, Prestamo, Resena } from './models.js';

const A = Autor.collection.name, L = Libro.collection.name, U = Usuario.collection.name,
  P = Prestamo.collection.name, R = Resena.collection.name;
const lk = (from, localField, as, foreignField = '_id') => ({ $lookup: { from, localField, foreignField, as } });
const un = (path) => ({ $unwind: `$${path}` });
const hoy = () => new Date();

// Cada consulta: { id, integrante, titulo, descripcion, modelo, pipeline() }
export const consultas = [
  // ===================== Integrante 1: LIBROS =====================
  { id: 'L01', integrante: 'Libros', titulo: 'Top 10 libros más prestados con su autor',
    descripcion: 'Préstamos por libro, con datos del autor, ordenados de mayor a menor.',
    modelo: Prestamo, pipeline: () => [
      { $group: { _id: '$libro', total: { $sum: 1 } } }, { $sort: { total: -1 } }, { $limit: 10 },
      lk(L, '_id', 'libro'), un('libro'), lk(A, 'libro.autor', 'autor'), un('autor'),
      { $project: { _id: 0, titulo: '$libro.titulo', autor: '$autor.nombre', prestamos: '$total' } }] },
  { id: 'L02', integrante: 'Libros', titulo: 'Calificación promedio por categoría',
    descripcion: 'Promedio de reseñas y cantidad de reseñas por categoría de libro.',
    modelo: Resena, pipeline: () => [
      lk(L, 'libro', 'l'), un('l'),
      { $group: { _id: '$l.categoria', promedio: { $avg: '$calificacion' }, resenas: { $sum: 1 } } },
      { $project: { _id: 0, categoria: '$_id', promedio: { $round: ['$promedio', 2] }, resenas: 1 } },
      { $sort: { promedio: -1 } }] },
  { id: 'L03', integrante: 'Libros', titulo: 'Libros sin ningún préstamo',
    descripcion: 'Libros que nunca han sido prestados (candidatos a descarte o promoción).',
    modelo: Libro, pipeline: () => [
      lk(P, '_id', 'p', 'libro'), { $match: { p: { $size: 0 } } },
      { $project: { _id: 0, titulo: 1, categoria: 1, anioPublicacion: 1 } }, { $limit: 50 }] },
  { id: 'L04', integrante: 'Libros', titulo: 'Libros con baja disponibilidad y alta demanda',
    descripcion: 'Libros con ≤1 ejemplar disponible y más de 3 préstamos históricos.',
    modelo: Libro, pipeline: () => [
      { $match: { disponibles: { $lte: 1 } } }, lk(P, '_id', 'p', 'libro'),
      { $addFields: { demanda: { $size: '$p' } } }, { $match: { demanda: { $gt: 3 } } },
      { $project: { _id: 0, titulo: 1, disponibles: 1, ejemplares: 1, demanda: 1 } }, { $sort: { demanda: -1 } }, { $limit: 50 }] },
  { id: 'L05', integrante: 'Libros', titulo: 'Desempeño por editorial (catálogo, préstamos y calificación)',
    descripcion: 'Cruza libros con préstamos y reseñas para evaluar volumen, demanda y calificación por editorial.',
    modelo: Libro, pipeline: () => [
      lk(P, '_id', 'p', 'libro'), lk(R, '_id', 'r', 'libro'),
      { $group: { _id: '$editorial', libros: { $sum: 1 }, paginas: { $sum: '$paginas' },
        prestamos: { $sum: { $size: '$p' } }, calif: { $avg: { $avg: '$r.calificacion' } } } },
      { $project: { _id: 0, editorial: '$_id', libros: 1, prestamos: 1,
        prestamosPorLibro: { $round: [{ $divide: ['$prestamos', { $max: ['$libros', 1] }] }, 2] },
        calificacion: { $round: [{ $ifNull: ['$calif', 0] }, 2] } } },
      { $sort: { prestamos: -1 } }] },
  { id: 'L06', integrante: 'Libros', titulo: 'Participación de categorías por década con ventana',
    descripcion: 'Cruza libros y préstamos por década y categoría, calculando participación porcentual con $setWindowFields.',
    modelo: Libro, pipeline: () => [
      lk(P, '_id', 'p', 'libro'),
      { $group: { _id: { decada: { $multiply: [{ $floor: { $divide: ['$anioPublicacion', 10] } }, 10] }, categoria: '$categoria' },
        libros: { $sum: 1 }, prestamos: { $sum: { $size: '$p' } } } },
      { $setWindowFields: { partitionBy: '$_id.decada', output: { totalDecada: { $sum: '$libros' } } } },
      { $project: { _id: 0, decada: '$_id.decada', categoria: '$_id.categoria', libros: 1, prestamos: 1,
        pctDecada: { $round: [{ $multiply: [{ $divide: ['$libros', { $max: ['$totalDecada', 1] }] }, 100] }, 1] } } },
      { $sort: { decada: -1, prestamos: -1 } }, { $limit: 40 }] },
  { id: 'L07', integrante: 'Libros', titulo: 'Libros mejor calificados con al menos 3 reseñas',
    descripcion: 'Ranking de libros por calificación promedio exigiendo mínimo de reseñas.',
    modelo: Resena, pipeline: () => [
      { $group: { _id: '$libro', promedio: { $avg: '$calificacion' }, n: { $sum: 1 } } }, { $match: { n: { $gte: 3 } } },
      { $sort: { promedio: -1, n: -1 } }, { $limit: 10 }, lk(L, '_id', 'l'), un('l'),
      { $project: { _id: 0, titulo: '$l.titulo', promedio: { $round: ['$promedio', 2] }, resenas: '$n' } }] },
  { id: 'L08', integrante: 'Libros', titulo: 'Tasa de ocupación y rotación histórica por categoría',
    descripcion: 'Cruza inventario con préstamos para calcular ocupación actual (%) y rotación promedio por ejemplar.',
    modelo: Libro, pipeline: () => [
      lk(P, '_id', 'p', 'libro'),
      { $group: { _id: '$categoria', ej: { $sum: '$ejemplares' }, disp: { $sum: '$disponibles' }, prestamos: { $sum: { $size: '$p' } } } },
      { $project: { _id: 0, categoria: '$_id', ejemplares: '$ej', disponibles: '$disp', prestamos: 1,
        ocupacionPct: { $round: [{ $multiply: [{ $subtract: [1, { $divide: ['$disp', { $max: ['$ej', 1] }] }] }, 100] }, 1] },
        rotacion: { $round: [{ $divide: ['$prestamos', { $max: ['$ej', 1] }] }, 2] } } },
      { $sort: { ocupacionPct: -1 } }] },
  { id: 'L09', integrante: 'Libros', titulo: 'Libros con multas acumuladas más altas',
    descripcion: 'Suma de multas generadas por libro.',
    modelo: Prestamo, pipeline: () => [
      { $group: { _id: '$libro', multas: { $sum: '$multa' }, vencidos: { $sum: { $cond: [{ $gt: ['$multa', 0] }, 1, 0] } } } },
      { $sort: { multas: -1 } }, { $limit: 10 }, lk(L, '_id', 'l'), un('l'),
      { $project: { _id: 0, titulo: '$l.titulo', multas: 1, prestamosConMulta: '$vencidos' } }] },
  { id: 'L10', integrante: 'Libros', titulo: 'Libros con reseñas y préstamos: ratio interés/lectura',
    descripcion: 'Cruza libros con préstamos y reseñas en paralelo para calcular el ratio de reseñas por préstamo.',
    modelo: Libro, pipeline: () => [
      lk(P, '_id', 'p', 'libro'), lk(R, '_id', 'r', 'libro'),
      { $project: { titulo: 1, prestamos: { $size: '$p' }, resenas: { $size: '$r' } } }, { $match: { prestamos: { $gt: 0 } } },
      { $addFields: { ratio: { $round: [{ $divide: ['$resenas', '$prestamos'] }, 2] } } },
      { $sort: { ratio: -1 } }, { $limit: 15 }, { $project: { _id: 0 } }] },

  // ===================== Integrante 2: USUARIOS =====================
  { id: 'U01', integrante: 'Usuarios', titulo: 'Usuarios más activos',
    descripcion: 'Top 10 usuarios por préstamos.', modelo: Prestamo, pipeline: () => [
      { $group: { _id: '$usuario', n: { $sum: 1 } } }, { $sort: { n: -1 } }, { $limit: 10 }, lk(U, '_id', 'u'), un('u'),
      { $project: { _id: 0, usuario: '$u.nombre', tipo: '$u.tipo', prestamos: '$n' } }] },
  { id: 'U02', integrante: 'Usuarios', titulo: 'Préstamos por tipo de usuario y estado',
    descripcion: 'Matriz tipo de usuario x estado del préstamo.', modelo: Prestamo, pipeline: () => [
      lk(U, 'usuario', 'u'), un('u'), { $group: { _id: { tipo: '$u.tipo', estado: '$estado' }, n: { $sum: 1 } } },
      { $project: { _id: 0, tipo: '$_id.tipo', estado: '$_id.estado', total: '$n' } }, { $sort: { tipo: 1, estado: 1 } }] },
  { id: 'U03', integrante: 'Usuarios', titulo: 'Usuarios con multas pendientes',
    descripcion: 'Usuarios con suma de multas > 0, ordenados por monto.', modelo: Prestamo, pipeline: () => [
      { $group: { _id: '$usuario', multas: { $sum: '$multa' } } }, { $match: { multas: { $gt: 0 } } },
      { $sort: { multas: -1 } }, { $limit: 15 }, lk(U, '_id', 'u'), un('u'),
      { $project: { _id: 0, usuario: '$u.nombre', correo: '$u.correo', multas: 1 } }] },
  { id: 'U04', integrante: 'Usuarios', titulo: 'Usuarios inactivos sin préstamos',
    descripcion: 'Usuarios que nunca han pedido un libro.', modelo: Usuario, pipeline: () => [
      lk(P, '_id', 'p', 'usuario'), { $match: { p: { $size: 0 } } }, { $project: { _id: 0, nombre: 1, tipo: 1, carrera: 1, activo: 1 } }, { $limit: 50 }] },
  { id: 'U05', integrante: 'Usuarios', titulo: 'Categoría favorita por carrera',
    descripcion: 'Categoría más prestada por cada carrera.', modelo: Prestamo, pipeline: () => [
      lk(U, 'usuario', 'u'), un('u'), lk(L, 'libro', 'l'), un('l'),
      { $group: { _id: { carrera: '$u.carrera', cat: '$l.categoria' }, n: { $sum: 1 } } }, { $sort: { n: -1 } },
      { $group: { _id: '$_id.carrera', categoria: { $first: '$_id.cat' }, prestamos: { $first: '$n' } } },
      { $project: { _id: 0, carrera: '$_id', categoria: 1, prestamos: 1 } }, { $sort: { carrera: 1 } }] },
  { id: 'U06', integrante: 'Usuarios', titulo: 'Usuarios con más préstamos pendientes',
    descripcion: 'Usuarios con préstamos activos o vencidos sin devolver, ordenados por cantidad.', modelo: Prestamo, pipeline: () => [
      { $match: { estado: { $in: ['activo', 'vencido'] } } }, { $group: { _id: '$usuario', activos: { $sum: 1 } } }, { $match: { activos: { $gte: 1 } } },
      { $sort: { activos: -1 } }, { $limit: 15 }, lk(U, '_id', 'u'), un('u'), { $project: { _id: 0, usuario: '$u.nombre', activos: 1 } }] },
  { id: 'U07', integrante: 'Usuarios', titulo: 'Crecimiento anual de usuarios con actividad y acumulado',
    descripcion: 'Cruza usuarios con préstamos por año y tipo, calculando tasa de actividad y acumulado histórico con $setWindowFields.', modelo: Usuario, pipeline: () => [
      lk(P, '_id', 'p', 'usuario'),
      { $group: { _id: { anio: { $year: '$fechaRegistro' }, tipo: '$tipo' }, usuarios: { $sum: 1 },
        conPrestamo: { $sum: { $cond: [{ $gt: [{ $size: '$p' }, 0] }, 1, 0] } } } },
      { $sort: { '_id.tipo': 1, '_id.anio': 1 } },
      { $setWindowFields: { partitionBy: '$_id.tipo', sortBy: { '_id.anio': 1 },
        output: { acumulado: { $sum: '$usuarios', window: { documents: ['unbounded', 'current'] } } } } },
      { $project: { _id: 0, anio: '$_id.anio', tipo: '$_id.tipo', usuarios: 1, conPrestamo: 1, acumulado: 1,
        actividadPct: { $round: [{ $multiply: [{ $divide: ['$conPrestamo', { $max: ['$usuarios', 1] }] }, 100] }, 1] } } },
      { $sort: { anio: 1, tipo: 1 } }] },
  { id: 'U08', integrante: 'Usuarios', titulo: 'Reseñadores más prolíficos y su calificación media',
    descripcion: 'Usuarios que más reseñan y qué tan generosos califican.', modelo: Resena, pipeline: () => [
      { $group: { _id: '$usuario', resenas: { $sum: 1 }, media: { $avg: '$calificacion' } } }, { $sort: { resenas: -1 } }, { $limit: 10 },
      lk(U, '_id', 'u'), un('u'), { $project: { _id: 0, usuario: '$u.nombre', resenas: 1, media: { $round: ['$media', 2] } } }] },
  { id: 'U09', integrante: 'Usuarios', titulo: 'Usuarios que leen y no devuelven a tiempo (tasa de retraso)',
    descripcion: 'Porcentaje de préstamos con multa por usuario (mín. 3 préstamos).', modelo: Prestamo, pipeline: () => [
      { $group: { _id: '$usuario', total: { $sum: 1 }, tarde: { $sum: { $cond: [{ $gt: ['$multa', 0] }, 1, 0] } } } },
      { $match: { total: { $gte: 3 } } }, { $addFields: { tasa: { $round: [{ $multiply: [{ $divide: ['$tarde', '$total'] }, 100] }, 1] } } },
      { $sort: { tasa: -1 } }, { $limit: 10 }, lk(U, '_id', 'u'), un('u'), { $project: { _id: 0, usuario: '$u.nombre', total: 1, tarde: 1, tasa: 1 } }] },
  { id: 'U10', integrante: 'Usuarios', titulo: 'Resumen integral por usuario (facet)',
    descripcion: 'Usa $facet: totales por tipo, top carreras y activos/inactivos en una sola consulta.', modelo: Usuario, pipeline: () => [
      { $facet: {
        porTipo: [{ $group: { _id: '$tipo', n: { $sum: 1 } } }],
        topCarreras: [{ $group: { _id: '$carrera', n: { $sum: 1 } } }, { $sort: { n: -1 } }, { $limit: 5 }],
        estado: [{ $group: { _id: '$activo', n: { $sum: 1 } } }] } }] },

  // ===================== Integrante 3: PRÉSTAMOS =====================
  { id: 'P01', integrante: 'Préstamos', titulo: 'Tendencia mensual con variación respecto al mes anterior',
    descripcion: 'Serie temporal mensual con préstamos, multas y variación porcentual usando $setWindowFields y $shift.', modelo: Prestamo, pipeline: () => [
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$fechaPrestamo' } }, prestamos: { $sum: 1 }, multas: { $sum: '$multa' } } },
      { $sort: { _id: 1 } },
      { $setWindowFields: { sortBy: { _id: 1 }, output: { anterior: { $shift: { output: '$prestamos', by: -1, default: null } } } } },
      { $project: { _id: 0, mes: '$_id', prestamos: 1, multas: 1,
        variacionPct: { $cond: [{ $gt: ['$anterior', 0] }, { $round: [{ $multiply: [{ $divide: [{ $subtract: ['$prestamos', '$anterior'] }, '$anterior'] }, 100] }, 1] }, 0] } } },
      { $sort: { mes: -1 } }, { $limit: 24 }] },
  { id: 'P02', integrante: 'Préstamos', titulo: 'Préstamos vencidos actualmente con detalle',
    descripcion: 'Préstamos activos con fecha de vencimiento pasada, con libro y usuario.', modelo: Prestamo, pipeline: () => [
      { $match: { estado: { $in: ['activo', 'vencido'] }, fechaVencimiento: { $lt: hoy() } } },
      lk(L, 'libro', 'l'), un('l'), lk(U, 'usuario', 'u'), un('u'),
      { $addFields: { diasRetraso: { $dateDiff: { startDate: '$fechaVencimiento', endDate: '$$NOW', unit: 'day' } } } },
      { $sort: { diasRetraso: -1 } }, { $limit: 25 },
      { $project: { _id: 0, libro: '$l.titulo', usuario: '$u.nombre', diasRetraso: 1 } }] },
  { id: 'P03', integrante: 'Préstamos', titulo: 'Duración promedio del préstamo por categoría',
    descripcion: 'Días promedio entre préstamo y devolución por categoría.', modelo: Prestamo, pipeline: () => [
      { $match: { fechaDevolucion: { $ne: null } } }, lk(L, 'libro', 'l'), un('l'),
      { $group: { _id: '$l.categoria', dias: { $avg: { $dateDiff: { startDate: '$fechaPrestamo', endDate: '$fechaDevolucion', unit: 'day' } } } } },
      { $project: { _id: 0, categoria: '$_id', diasPromedio: { $round: ['$dias', 1] } } }, { $sort: { diasPromedio: -1 } }] },
  { id: 'P04', integrante: 'Préstamos', titulo: 'Ingresos por multas por mes',
    descripcion: 'Suma mensual de multas.', modelo: Prestamo, pipeline: () => [
      { $match: { multa: { $gt: 0 } } }, { $group: { _id: { y: { $year: '$fechaPrestamo' }, m: { $month: '$fechaPrestamo' } }, total: { $sum: '$multa' }, n: { $sum: 1 } } },
      { $project: { _id: 0, anio: '$_id.y', mes: '$_id.m', total: 1, prestamos: '$n' } }, { $sort: { anio: -1, mes: -1 } }, { $limit: 24 }] },
  { id: 'P05', integrante: 'Préstamos', titulo: 'Carga operativa y multas por día de la semana',
    descripcion: 'Clasifica el día con $switch, calcula multas promedio y participación semanal con $setWindowFields.', modelo: Prestamo, pipeline: () => [
      { $group: { _id: { $dayOfWeek: '$fechaPrestamo' }, prestamos: { $sum: 1 },
        conMulta: { $sum: { $cond: [{ $gt: ['$multa', 0] }, 1, 0] } }, multas: { $sum: '$multa' } } },
      { $setWindowFields: { output: { totalSemana: { $sum: '$prestamos' } } } },
      { $project: { _id: 0, orden: '$_id',
        dia: { $switch: { branches: [
          { case: { $eq: ['$_id', 1] }, then: 'Domingo' }, { case: { $eq: ['$_id', 2] }, then: 'Lunes' },
          { case: { $eq: ['$_id', 3] }, then: 'Martes' }, { case: { $eq: ['$_id', 4] }, then: 'Miércoles' },
          { case: { $eq: ['$_id', 5] }, then: 'Jueves' }, { case: { $eq: ['$_id', 6] }, then: 'Viernes' }], default: 'Sábado' } },
        prestamos: 1, conMulta: 1, multas: 1,
        pct: { $round: [{ $multiply: [{ $divide: ['$prestamos', { $max: ['$totalSemana', 1] }] }, 100] }, 1] } } },
      { $sort: { orden: 1 } }, { $project: { orden: 0 } }] },
  { id: 'P06', integrante: 'Préstamos', titulo: 'Estado de préstamos por tipo de usuario con porcentaje',
    descripcion: 'Porcentaje de cada estado por tipo de usuario usando $setWindowFields.', modelo: Prestamo, pipeline: () => [
      lk(U, 'usuario', 'u'), un('u'), { $group: { _id: { t: '$u.tipo', e: '$estado' }, n: { $sum: 1 } } },
      { $setWindowFields: { partitionBy: '$_id.t', output: { totalTipo: { $sum: '$n' } } } },
      { $project: { _id: 0, tipo: '$_id.t', estado: '$_id.e', n: 1, pct: { $round: [{ $multiply: [{ $divide: ['$n', '$totalTipo'] }, 100] }, 1] } } }, { $sort: { tipo: 1, estado: 1 } }] },
  { id: 'P07', integrante: 'Préstamos', titulo: 'Acumulado de préstamos mes a mes',
    descripcion: 'Suma acumulada con ventana sobre serie mensual.', modelo: Prestamo, pipeline: () => [
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$fechaPrestamo' } }, n: { $sum: 1 } } }, { $sort: { _id: 1 } },
      { $setWindowFields: { sortBy: { _id: 1 }, output: { acumulado: { $sum: '$n', window: { documents: ['unbounded', 'current'] } } } } },
      { $project: { _id: 0, mes: '$_id', prestamos: '$n', acumulado: 1 } }] },
  { id: 'P08', integrante: 'Préstamos', titulo: 'Pares de libros prestados al mismo usuario',
    descripcion: 'Libros que se prestan juntos (co-ocurrencia) para recomendación.', modelo: Prestamo, pipeline: () => [
      { $group: { _id: '$usuario', libros: { $addToSet: '$libro' } } }, { $match: { 'libros.1': { $exists: true } } },
      { $project: { libros: { $slice: ['$libros', 4] } } }, { $unwind: '$libros' },
      { $group: { _id: '$libros', usuarios: { $sum: 1 } } }, { $sort: { usuarios: -1 } }, { $limit: 10 },
      lk(L, '_id', 'l'), un('l'), { $project: { _id: 0, titulo: '$l.titulo', usuarios: 1 } }] },
  { id: 'P09', integrante: 'Préstamos', titulo: 'Préstamos devueltos antes de tiempo vs tarde',
    descripcion: 'Clasifica devoluciones con $switch y cuenta.', modelo: Prestamo, pipeline: () => [
      { $match: { fechaDevolucion: { $ne: null } } },
      { $addFields: { clase: { $switch: { branches: [
        { case: { $lt: ['$fechaDevolucion', '$fechaVencimiento'] }, then: 'anticipada' },
        { case: { $eq: ['$multa', 0] }, then: 'a_tiempo' }], default: 'tardía' } } } },
      { $group: { _id: '$clase', n: { $sum: 1 } } }, { $project: { _id: 0, clase: '$_id', n: 1 } }] },
  { id: 'P10', integrante: 'Préstamos', titulo: 'Panel ejecutivo de préstamos (facet)',
    descripcion: 'Totales por estado, multas totales y top 3 libros en una sola consulta.', modelo: Prestamo, pipeline: () => [
      { $facet: {
        porEstado: [{ $group: { _id: '$estado', n: { $sum: 1 } } }],
        multas: [{ $group: { _id: null, total: { $sum: '$multa' }, promedio: { $avg: '$multa' } } }],
        topLibros: [{ $group: { _id: '$libro', n: { $sum: 1 } } }, { $sort: { n: -1 } }, { $limit: 3 }, lk(L, '_id', 'l'), un('l'), { $project: { _id: 0, titulo: '$l.titulo', n: 1 } }] } }] },
];


