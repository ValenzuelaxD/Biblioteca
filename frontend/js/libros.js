import { gql, pantallaCRUD, esc, badge } from './api.js';
const F = 'id titulo isbn categoria editorial anioPublicacion paginas ejemplares disponibles autor { id nombre }';
const cats = ['Novela', 'Ciencia', 'Historia', 'Tecnología', 'Filosofía', 'Arte', 'Matemáticas', 'Poesía', 'Derecho', 'Medicina'];

pantallaCRUD({
  titulo: 'Catálogo de Libros', singular: 'libro',
  subtitulo: 'Registra nuevos títulos, actualiza ejemplares disponibles y busca en todo el catálogo.',
  placeholder: 'Buscar por título, autor, ISBN o editorial...',
  filtros: [{ n: 'categoria', label: 'Categoría', opciones: cats },
    { n: 'soloDisponibles', label: 'Disponibilidad', opciones: [['true', 'Solo disponibles']] }],
  listar: async (b, f, p) => {
    const d = await gql(`query($l:Int,$s:Int,$b:String,$c:String,$d:Boolean){
      libros(limite:$l,saltar:$s,buscar:$b,categoria:$c,soloDisponibles:$d){ ${F} }
      totalLibros(buscar:$b,categoria:$c,soloDisponibles:$d)
    }`, { l: p.limite, s: p.saltar, b, c: f.categoria, d: f.soloDisponibles ? true : null });
    return { items: d.libros, total: d.totalLibros };
  },
  campos: [
    { n: 'titulo', label: 'Título', req: true },
    { n: 'autor', label: 'Autor', placeholder: 'Escribe el nombre del autor...', req: true,
      buscar: async (q) => (await gql('query($b:String){ autores(limite:15,buscar:$b){ id nombre } }', { b: q || null })).autores.map((a) => [a.id, a.nombre]) },
    { n: 'categoria', label: 'Categoría', opciones: cats },
    { n: 'editorial', label: 'Editorial' },
    { n: 'isbn', label: 'ISBN' },
    { n: 'anioPublicacion', label: 'Año de publicación', tipo: 'number' },
    { n: 'paginas', label: 'Páginas', tipo: 'number' },
    { n: 'ejemplares', label: 'Ejemplares totales', tipo: 'number' },
    { n: 'disponibles', label: 'Ejemplares disponibles', tipo: 'number' },
  ],
  valor: (r, n) => (n === 'autor' ? (r.autor ? [r.autor.id, r.autor.nombre] : ['', '']) : (r[n] ?? '')),
  columnas: [
    { label: 'Título', html: true, fn: (x) => `<span class="td-title">${esc(x.titulo)}</span>` },
    { label: 'Autor', fn: (x) => x.autor?.nombre || '—' },
    { label: 'Categoría', html: true, fn: (x) => badge(x.categoria || 'General', 'neu') },
    { label: 'Editorial', fn: (x) => x.editorial || '—' },
    { label: 'Año', fn: (x) => x.anioPublicacion || '—' },
    { label: 'Disponibles', html: true, fn: (x) => badge(`${x.disponibles} / ${x.ejemplares}`, x.disponibles > 0 ? 'ok' : 'err') },
  ],
  crear: (input) => gql('mutation($i:LibroInput!){ crearLibro(input:$i){ id } }', { i: input }),
  actualizar: (id, input) => gql('mutation($id:ID!,$i:LibroInput!){ actualizarLibro(id:$id,input:$i){ id } }', { id, i: input }),
  eliminar: (id) => gql('mutation($id:ID!){ eliminarLibro(id:$id) }', { id }),
});
