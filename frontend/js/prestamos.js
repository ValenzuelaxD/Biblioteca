import { gql, pantallaCRUD, esc, badge } from './api.js';
const estCls = { activo: 'info', devuelto: 'ok', vencido: 'err' };

pantallaCRUD({
  titulo: 'Control de Préstamos', singular: 'préstamo',
  subtitulo: 'Registra préstamos, controla fechas de vencimiento, devoluciones y multas.',
  placeholder: 'Buscar por título del libro o nombre del usuario...',
  filtros: [{ n: 'estado', label: 'Estado', opciones: [['activo', 'Activo'], ['devuelto', 'Devuelto'], ['vencido', 'Vencido']] },
    { n: 'conMulta', label: 'Multas', opciones: [['true', 'Solo con multa']] }],
  listar: async (b, f, p) => {
    const m = f.conMulta ? true : null;
    const d = await gql(`query($l:Int,$s:Int,$b:String,$e:String,$m:Boolean){
      prestamos(limite:$l,saltar:$s,buscar:$b,estado:$e,conMulta:$m){ id estado multa fechaPrestamo fechaVencimiento libro{ id titulo } usuario{ id nombre } }
      totalPrestamos(buscar:$b,estado:$e,conMulta:$m)
    }`, { l: p.limite, s: p.saltar, b, e: f.estado, m });
    return { items: d.prestamos, total: d.totalPrestamos };
  },
  campos: [
    { n: 'libro', label: 'Libro', placeholder: 'Escribe el título del libro...', req: true,
      buscar: async (q) => (await gql('query($b:String){ libros(limite:15,buscar:$b){ id titulo } }', { b: q || null })).libros.map((l) => [l.id, l.titulo]) },
    { n: 'usuario', label: 'Usuario', placeholder: 'Escribe el nombre del usuario...', req: true,
      buscar: async (q) => (await gql('query($b:String){ usuarios(limite:15,buscar:$b){ id nombre } }', { b: q || null })).usuarios.map((u) => [u.id, u.nombre]) },
    { n: 'fechaVencimiento', label: 'Fecha de vencimiento', tipo: 'date' },
    { n: 'estado', label: 'Estado', opciones: [['activo', 'Activo'], ['devuelto', 'Devuelto'], ['vencido', 'Vencido']] },
    { n: 'multa', label: 'Multa ($)', tipo: 'number' },
  ],
  valor: (r, n) => (n === 'libro' ? (r.libro ? [r.libro.id, r.libro.titulo] : ['', '']) : n === 'usuario' ? (r.usuario ? [r.usuario.id, r.usuario.nombre] : ['', '']) : n === 'fechaVencimiento' ? (r[n] || '').slice(0, 10) : (r[n] ?? '')),
  columnas: [
    { label: 'Libro', html: true, fn: (x) => `<span class="td-title">${esc(x.libro?.titulo || '—')}</span>` },
    { label: 'Usuario', fn: (x) => x.usuario?.nombre || '—' },
    { label: 'Prestado', fn: (x) => (x.fechaPrestamo || '').slice(0, 10) },
    { label: 'Vence', fn: (x) => (x.fechaVencimiento || '').slice(0, 10) },
    { label: 'Estado', html: true, fn: (x) => badge(x.estado, estCls[x.estado] || 'neu') },
    { label: 'Multa', html: true, fn: (x) => (x.multa > 0 ? badge(`$${x.multa}`, 'warn') : '<span style="color:var(--mut)">$0</span>') },
  ],
  crear: (input) => gql('mutation($i:PrestamoInput!){ crearPrestamo(input:$i){ id } }', { i: input }),
  actualizar: (id, input) => gql('mutation($id:ID!,$i:PrestamoInput!){ actualizarPrestamo(id:$id,input:$i){ id } }', { id, i: input }),
  eliminar: (id) => gql('mutation($id:ID!){ eliminarPrestamo(id:$id) }', { id }),
});
