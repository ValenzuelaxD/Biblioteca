import mongoose from 'mongoose';
const { Schema, model } = mongoose;

export const Autor = model('Autor', new Schema({
  nombre: { type: String, required: true },
  nacionalidad: String,
  anioNacimiento: Number,
  biografia: String,
}, { timestamps: true }));

export const Libro = model('Libro', new Schema({
  titulo: { type: String, required: true },
  isbn: { type: String, index: true },
  autor: { type: Schema.Types.ObjectId, ref: 'Autor', required: true },
  categoria: String,
  editorial: String,
  anioPublicacion: Number,
  paginas: Number,
  ejemplares: { type: Number, default: 1 },
  disponibles: { type: Number, default: 1 },
}, { timestamps: true }));

export const Usuario = model('Usuario', new Schema({
  nombre: { type: String, required: true },
  correo: { type: String, unique: true },
  tipo: { type: String, enum: ['estudiante', 'docente', 'externo'], default: 'estudiante' },
  carrera: String,
  activo: { type: Boolean, default: true },
  fechaRegistro: { type: Date, default: Date.now },
}));

export const Prestamo = model('Prestamo', new Schema({
  libro: { type: Schema.Types.ObjectId, ref: 'Libro', required: true },
  usuario: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  fechaPrestamo: { type: Date, default: Date.now },
  fechaVencimiento: Date,
  fechaDevolucion: Date,
  estado: { type: String, enum: ['activo', 'devuelto', 'vencido'], default: 'activo' },
  multa: { type: Number, default: 0 },
}));

export const Resena = model('Resena', new Schema({
  libro: { type: Schema.Types.ObjectId, ref: 'Libro', required: true },
  usuario: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  calificacion: { type: Number, min: 1, max: 5 },
  comentario: String,
  fecha: { type: Date, default: Date.now },
}));
