import { gql, esc } from './api.js';

const root = document.getElementById('app');
const { consultas } = await gql('{ consultas { id integrante titulo descripcion } }');
const grupos = [...new Set(consultas.map((c) => c.integrante))];

const etiquetas = {
  titulo: 'Título', autor: 'Autor', prestamos: 'Préstamos', categoria: 'Categoría',
  promedio: 'Promedio', resenas: 'Reseñas', anioPublicacion: 'Año', disponibles: 'Disponibles',
  ejemplares: 'Ejemplares', demanda: 'Demanda', editorial: 'Editorial', libros: 'Libros',
  paginas: 'Páginas', anioPromedio: 'Año promedio', decada: 'Década', total: 'Total',
  ocupacionPct: 'Ocupación (%)', multas: 'Multas ($)', prestamosConMulta: 'Con multa',
  ratio: 'Ratio', usuario: 'Usuario', tipo: 'Tipo', estado: 'Estado', correo: 'Correo',
  nombre: 'Nombre', carrera: 'Carrera', activo: 'Activo', activos: 'Activos', anio: 'Año',
  usuarios: 'Usuarios', media: 'Media', tarde: 'Con retraso', tasa: 'Tasa (%)',
  mes: 'Mes', libro: 'Libro', diasRetraso: 'Días de retraso', diasPromedio: 'Días promedio',
  diaSemana: 'Día de semana', dia: 'Día', n: 'Cantidad', pct: 'Porcentaje (%)',
  acumulado: 'Acumulado', clase: 'Clasificación', prestamosPorLibro: 'Préstamos / libro',
  calificacion: 'Calificación', pctDecada: '% en década', rotacion: 'Rotación',
  conPrestamo: 'Con préstamo', actividadPct: 'Actividad (%)', variacionPct: 'Variación (%)',
  conMulta: 'Con multa',
};
const bonito = (k) => etiquetas[k] || k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());

const chevronSVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>';

root.innerHTML = `
  <div class="page-head">
    <div>
      <h2>Reportes de la Biblioteca</h2>
      <p class="page-sub">${consultas.length} reportes listos para consultar préstamos, libros más leídos, multas y actividad de usuarios.</p>
    </div>
  </div>
  <div class="filtros">
    <input id="buscar" type="search" placeholder="Buscar reporte por tema o palabra clave...">
    <select id="grupo" aria-label="Filtrar por área"><option value="">Área: todas</option>${grupos.map((g) => `<option value="${esc(g)}">${esc(g)}</option>`).join('')}</select>
    <button type="button" id="limpiar" class="sec">Limpiar filtros</button>
  </div>
  <div id="lista"></div>`;

function tablaHTML(datos) {
  if (!Array.isArray(datos) || !datos.length) return '<p class="page-sub">Sin registros para este reporte.</p>';
  const primero = datos[0];
  const esPlano = primero && typeof primero === 'object' && !Array.isArray(primero)
    && Object.values(primero).every((v) => v === null || typeof v !== 'object');
  if (!esPlano) return null;
  const cols = Object.keys(primero);
  return `<div class="table-wrap"><table><thead><tr>${cols.map((k) => `<th>${esc(bonito(k))}</th>`).join('')}</tr></thead><tbody>
    ${datos.map((row) => `<tr>${cols.map((k) => `<td>${esc(row[k] === true ? 'Sí' : row[k] === false ? 'No' : row[k])}</td>`).join('')}</tr>`).join('')}
  </tbody></table></div>`;
}

const render = () => {
  const q = root.querySelector('#buscar').value.trim().toLowerCase();
  const gSel = root.querySelector('#grupo').value;
  const vis = consultas.filter((c) => (!gSel || c.integrante === gSel) && (!q || `${c.id} ${c.titulo} ${c.descripcion}`.toLowerCase().includes(q)));
  const gs = [...new Set(vis.map((c) => c.integrante))];
  root.querySelector('#lista').innerHTML = gs.length
    ? gs.map((g) => `<h3 class="grupo-head">${esc(g)}</h3>${vis.filter((c) => c.integrante === g).map((c) => `
      <article class="q-card" data-card="${c.id}">
        <div class="q-top">
          <div>
            <div class="q-title"><span class="badge info">${esc(c.id)}</span><span>${esc(c.titulo)}</span></div>
            <p class="q-desc">${esc(c.descripcion)}</p>
          </div>
          <div class="q-actions">
            <button type="button" data-id="${c.id}">Generar reporte</button>
            <button type="button" class="sec btn-chevron" data-expand="${c.id}" aria-expanded="false" aria-label="Expandir o retraer reporte" title="Expandir / retraer">${chevronSVG}</button>
          </div>
        </div>
        <div class="q-out" hidden></div>
      </article>`).join('')}`).join('')
    : '<p class="empty-cell">No hay reportes que coincidan con tu búsqueda.</p>';
};

async function ejecutar(card) {
  const id = card.dataset.card;
  const btn = card.querySelector('[data-id]');
  const chev = card.querySelector('[data-expand]');
  const out = card.querySelector('.q-out');
  btn.disabled = true; btn.textContent = 'Generando...';
  out.hidden = false;
  chev.setAttribute('aria-expanded', 'true');
  out.innerHTML = '<div class="skel"></div>';
  try {
    const r = (await gql('query($id:ID!){ ejecutarConsulta(id:$id){ total datos } }', { id })).ejecutarConsulta;
    const tbl = tablaHTML(r.datos);
    out.dataset.cargado = '1';
    out.innerHTML = `
      <div class="q-out-bar">
        <span>${r.total} resultado(s)</span>
        ${tbl ? '<button type="button" class="sec sm" data-toggle="1">Ver datos técnicos</button>' : ''}
      </div>
      ${tbl ? `<div class="q-tbl">${tbl}</div>` : ''}
      <pre ${tbl ? 'hidden' : ''}>${esc(JSON.stringify(r.datos, null, 2))}</pre>`;
  } catch (err) {
    out.innerHTML = `<p style="color:var(--err-ink);margin:0">${esc(err.message)}</p>`;
  } finally {
    btn.disabled = false; btn.textContent = 'Actualizar';
  }
}

root.querySelector('#buscar').oninput = render;
root.querySelector('#grupo').onchange = render;
root.querySelector('#limpiar').onclick = () => { root.querySelector('#buscar').value = ''; root.querySelector('#grupo').value = ''; render(); };

root.addEventListener('click', async (e) => {
  const tog = e.target.closest('[data-toggle]');
  if (tog) {
    const out = tog.closest('.q-out');
    const tb = out.querySelector('.q-tbl'), pre = out.querySelector('pre');
    const verJson = pre.hidden;
    pre.hidden = !verJson; if (tb) tb.hidden = verJson;
    tog.textContent = verJson ? 'Ver como tabla' : 'Ver datos técnicos';
    return;
  }
  const exp = e.target.closest('[data-expand]');
  if (exp) {
    const card = exp.closest('.q-card');
    const out = card.querySelector('.q-out');
    if (!out.dataset.cargado) { await ejecutar(card); return; }
    const abierto = !out.hidden;
    out.hidden = abierto;
    exp.setAttribute('aria-expanded', String(!abierto));
    return;
  }
  const btn = e.target.closest('[data-id]');
  if (btn) await ejecutar(btn.closest('.q-card'));
});

render();
