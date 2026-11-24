import { gql, pantallaCRUD, esc, badge } from './api.js';
const tipoCls = { estudiante: 'info', docente: 'warn', externo: 'neu' };
pantallaCRUD({
  titulo: 'Directorio de Usuarios', singular: 'usuario',
  subtitulo: 'Administra el registro de estudiantes, docentes y visitantes externos.',
  placeholder: 'Buscar por nombre, correo o carrera...',
  filtros: [{ n: 'tipo', label: 'Tipo', opciones: [['estudiante', 'Estudiante'], ['docente', 'Docente'], ['externo', 'Externo']] },
    { n: 'activo', label: 'Estado', opciones: [['true', 'Activos'], ['false', 'Inactivos']] }],
  listar: async (b, f, p) => {
    const a = f.activo == null ? null : f.activo === 'true';
    const d = await gql(`query($l:Int,$s:Int,$b:String,$t:String,$a:Boolean){
      usuarios(limite:$l,saltar:$s,buscar:$b,tipo:$t,activo:$a){ id nombre correo tipo carrera activo }
      totalUsuarios(buscar:$b,tipo:$t,activo:$a)
    }`, { l: p.limite, s: p.saltar, b, t: f.tipo, a });
    return { items: d.usuarios, total: d.totalUsuarios };
  },
  campos: [
    { n: 'nombre', label: 'Nombre completo', req: true },
    { n: 'correo', label: 'Correo electrónico', tipo: 'email' },
    { n: 'tipo', label: 'Tipo de usuario', opciones: [['estudiante', 'Estudiante'], ['docente', 'Docente'], ['externo', 'Externo']] },
    { n: 'carrera', label: 'Carrera o área' },
    { n: 'activo', label: 'Estado', opciones: [['true', 'Activo'], ['false', 'Inactivo']], bool: true },
  ],
  columnas: [
    { label: 'Nombre', html: true, fn: (x) => `<span class="td-title">${esc(x.nombre)}</span>` },
    { label: 'Correo', fn: (x) => x.correo || '—' },
    { label: 'Tipo', html: true, fn: (x) => badge(x.tipo, tipoCls[x.tipo] || 'neu') },
    { label: 'Carrera', fn: (x) => x.carrera || '—' },
    { label: 'Estado', html: true, fn: (x) => badge(x.activo ? 'Activo' : 'Inactivo', x.activo ? 'ok' : 'neu') },
  ],
  crear: (input) => gql('mutation($i:UsuarioInput!){ crearUsuario(input:$i){ id } }', { i: input }),
  actualizar: (id, input) => gql('mutation($id:ID!,$i:UsuarioInput!){ actualizarUsuario(id:$id,input:$i){ id } }', { id, i: input }),
  eliminar: (id) => gql('mutation($id:ID!){ eliminarUsuario(id:$id) }', { id }),
});
