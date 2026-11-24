const g = async (query, variables) => { const r = await fetch('http://localhost:4000/graphql', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query, variables }) }); return r.json(); };
const { data } = await g('{ consultas { id } }');
let bad = 0;
for (const { id } of data.consultas) {
  const r = await g('query($id:ID!){ ejecutarConsulta(id:$id){ total } }', { id });
  const ok = !r.errors; if (!ok) bad++;
  console.log(id, ok ? r.data.ejecutarConsulta.total : 'ERROR ' + r.errors[0].message);
}
console.log('consultas:', data.consultas.length, 'fallidas:', bad);
// CRUD autor
const c = await g('mutation{ crearAutor(input:{nombre:"Test"}){ id } }'); const id = c.data.crearAutor.id;
const u = await g('mutation($id:ID!){ actualizarAutor(id:$id,input:{nombre:"Test2"}){ nombre } }', { id });
const d = await g('mutation($id:ID!){ eliminarAutor(id:$id) }', { id });
console.log('CRUD', c.errors || u.data.actualizarAutor, d.data);
console.log((await g('{ conteos libros(limite:1){ titulo autor{ nombre } } }')).data);
