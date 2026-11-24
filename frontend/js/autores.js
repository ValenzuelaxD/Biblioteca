import { gql, pantallaCRUD, esc, badge } from './api.js';
const nacs = ['México', 'España', 'Argentina', 'Colombia', 'Chile', 'EE.UU.', 'Francia', 'Reino Unido', 'Alemania', 'Perú'];
pantallaCRUD({
  titulo: 'Autores', singular: 'autor',
  subtitulo: 'Consulta y administra los autores registrados en la biblioteca.',
  placeholder: 'Buscar por nombre o nacionalidad...',
  filtros: [{ n: 'nacionalidad', label: 'Nacionalidad', opciones: nacs }],
  listar: async (b, f, p) => {
    const d = await gql(`query($l:Int,$s:Int,$b:String,$n:String){
      autores(limite:$l,saltar:$s,buscar:$b,nacionalidad:$n){ id nombre nacionalidad anioNacimiento biografia }
      totalAutores(buscar:$b,nacionalidad:$n)
    }`, { l: p.limite, s: p.saltar, b, n: f.nacionalidad });
    return { items: d.autores, total: d.totalAutores };
  },
  campos: [
    { n: 'nombre', label: 'Nombre completo', req: true },
    { n: 'nacionalidad', label: 'Nacionalidad', opciones: nacs },
    { n: 'anioNacimiento', label: 'Año de nacimiento', tipo: 'number' },
    { n: 'biografia', label: 'Semblanza / biografía' },
  ],
  columnas: [
    { label: 'Nombre', html: true, fn: (x) => `<span class="td-title">${esc(x.nombre)}</span>` },
    { label: 'Nacionalidad', html: true, fn: (x) => badge(x.nacionalidad || '—', 'neu') },
    { label: 'Nacimiento', fn: (x) => x.anioNacimiento || '—' },
    { label: 'Semblanza', fn: (x) => (x.biografia?.length > 75 ? x.biografia.slice(0, 75) + '…' : x.biografia || '—') },
  ],
  crear: (input) => gql('mutation($i:AutorInput!){ crearAutor(input:$i){ id } }', { i: input }),
  actualizar: (id, input) => gql('mutation($id:ID!,$i:AutorInput!){ actualizarAutor(id:$id,input:$i){ id } }', { id, i: input }),
  eliminar: (id) => gql('mutation($id:ID!){ eliminarAutor(id:$id) }', { id }),
});
