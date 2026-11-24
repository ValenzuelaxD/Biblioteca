// Cliente GraphQL compartido por todas las pantallas (fetch -> POST /graphql)
export const API = location.port === '4000' ? '/graphql' : 'http://localhost:4000/graphql';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Resalta la pestaña actual en el menú
const cur = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
document.querySelectorAll('header nav a').forEach((a) => {
  if ((a.getAttribute('href') || '').toLowerCase() === cur) a.classList.add('on');
});

// Sesión visual simulada (no toca la base de datos)
const USUARIO_DEF = 'Sarahí Aguilera';
function montarSesion() {
  const hdr = document.querySelector('header .hdr-inner');
  if (!hdr) return;
  const nombre = sessionStorage.getItem('bib_user') || USUARIO_DEF;
  const iniciales = nombre.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
  const chip = document.createElement('div');
  chip.className = 'user-chip';
  chip.innerHTML = `
    <span class="user-av" aria-hidden="true">${esc(iniciales)}</span>
    <span class="user-meta"><strong>${esc(nombre)}</strong><small>Encargada</small></span>
    <button type="button" class="user-out" title="Cerrar sesión">Salir</button>`;
  hdr.appendChild(chip);

  const modal = document.createElement('div');
  modal.className = 'login-wall';
  modal.hidden = sessionStorage.getItem('bib_out') !== '1';
  modal.innerHTML = `
    <div class="login-box">
      <div class="login-head">
        <img src="img/logo-solon.png" alt="Biblioteca Solón Argüello" class="login-logo">
        <p>Inicia sesión para continuar</p>
      </div>
      <form id="login-f">
        <label>Usuario<input name="u" value="${esc(nombre)}" required></label>
        <label>Contraseña<input name="p" type="password" value="••••••••" required></label>
        <button type="submit" style="width:100%">Iniciar sesión</button>
      </form>
    </div>`;
  document.body.appendChild(modal);

  chip.querySelector('.user-out').onclick = () => {
    sessionStorage.setItem('bib_out', '1');
    modal.hidden = false;
  };
  modal.querySelector('#login-f').onsubmit = (ev) => {
    ev.preventDefault();
    const n = ev.target.u.value.trim() || USUARIO_DEF;
    sessionStorage.setItem('bib_user', n);
    sessionStorage.removeItem('bib_out');
    chip.querySelector('strong').textContent = n;
    chip.querySelector('.user-av').textContent = n.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
    modal.hidden = true;
  };
}
montarSesion();

export async function gql(query, variables = {}) {
  const r = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query, variables }) });
  const j = await r.json();
  if (j.errors) throw new Error(j.errors.map((e) => e.message).join('; '));
  return j.data;
}

export const badge = (texto, tipo = 'neu') => `<span class="badge ${tipo}">${esc(texto)}</span>`;

const prevSVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>';
const nextSVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>';

export function pantallaCRUD(cfg) {
  const root = document.getElementById('app');
  const singular = cfg.singular || 'registro';
  const tamanos = [5, 10, 20, 50, 200];

  const navPag = (pos) => `
    <div class="pag-nav" data-pag="${pos}">
      <button type="button" class="sec sm btn-pag" data-dir="-1" aria-label="Página anterior">${prevSVG} Anterior</button>
      <span class="pag-info">Página 1 de 1</span>
      <button type="button" class="sec sm btn-pag" data-dir="1" aria-label="Página siguiente">Siguiente ${nextSVG}</button>
    </div>`;

  root.innerHTML = `
    <div class="page-head">
      <div>
        <h2>${esc(cfg.titulo)}</h2>
        ${cfg.subtitulo ? `<p class="page-sub">${esc(cfg.subtitulo)}</p>` : ''}
      </div>
      <button type="button" id="btn-nuevo">+ Nuevo ${esc(singular)}</button>
    </div>
    <div id="msg" role="status"></div>
    <section class="form-panel" id="panel-form" hidden>
      <div class="form-head">
        <h3 id="form-titulo">Nuevo ${esc(singular)}</h3>
        <button type="button" id="cerrar-form" class="sec sm">Cerrar</button>
      </div>
      <form id="f" class="crud-form"><input type="hidden" name="id">
        ${cfg.campos.map((c) => `<label>${esc(c.label)}${c.buscar
          ? `<div class="combo" data-combo="${c.n}"><input type="hidden" name="${c.n}"><input type="text" class="combo-in" autocomplete="off" placeholder="${esc(c.placeholder || 'Escribe para buscar...')}" ${c.req ? 'required' : ''}><div class="combo-list" hidden></div></div>`
          : c.opciones
          ? `<select name="${c.n}">${c.opciones.map((o) => { const [v, t] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(v)}">${esc(t)}</option>`; }).join('')}</select>`
          : `<input name="${c.n}" type="${c.tipo || 'text'}" ${c.req ? 'required' : ''}>`}</label>`).join('')}
        <div class="acciones">
          <button type="button" id="cancelar" class="sec">Cancelar</button>
          <button type="submit" id="guardar">Guardar ${esc(singular)}</button>
        </div>
      </form>
    </section>
    <div class="filtros">
      <input id="buscar" type="search" placeholder="${esc(cfg.placeholder || 'Buscar...')}" ${cfg.buscar === false ? 'hidden' : ''}>
      ${(cfg.filtros || []).map((x) => `<select data-filtro="${x.n}" aria-label="${esc(x.label)}"><option value="">${esc(x.label)}: todos</option>${x.opciones.map((o) => { const [v, t] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(v)}">${esc(t)}</option>`; }).join('')}</select>`).join('')}
      <button type="button" id="limpiar" class="sec">Limpiar filtros</button>
    </div>
    <div class="meta-bar">
      <span id="conteo">Cargando registros...</span>
      <div class="pag-controls">
        <label class="pag-size">Mostrar
          <select id="por-pagina" aria-label="Registros por página">
            ${tamanos.map((n) => `<option value="${n}" ${n === 20 ? 'selected' : ''}>${n}</option>`).join('')}
          </select>
        </label>
        ${navPag('top')}
      </div>
    </div>
    <div class="table-wrap">
      <table><thead><tr>${cfg.columnas.map((c) => `<th>${esc(c.label)}</th>`).join('')}<th>Acciones</th></tr></thead><tbody id="tb"></tbody></table>
    </div>
    <div class="meta-bar meta-bottom">
      <span id="conteo-bottom"></span>
      ${navPag('bottom')}
    </div>`;

  const $ = (s) => root.querySelector(s), f = $('#f'), panel = $('#panel-form');
  let filas = [], pagina = 1, porPagina = 20, totalReg = 0, opcionesCargadas = false;
  async function asegurarOpciones() {
    if (opcionesCargadas || !cfg.cargarOpciones) return;
    opcionesCargadas = true;
    const mapa = await cfg.cargarOpciones();
    Object.entries(mapa).forEach(([campo, ops]) => {
      const sel = f[campo];
      if (!sel) return;
      sel.innerHTML = ops.map((o) => { const [v, t] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(v)}">${esc(t)}</option>`; }).join('');
    });
  }
  const msg = (t, err = false) => { const m = $('#msg'); m.textContent = t; m.className = err ? 'err' : 'ok'; };
  const cols = cfg.columnas.length + 1;

  function skel() {
    $('#tb').innerHTML = Array.from({ length: Math.min(porPagina, 5) }, () => `<tr>${Array.from({ length: cols }, () => '<td><div class="skel"></div></td>').join('')}</tr>`).join('');
  }

  function actualizarPag() {
    const totalPags = Math.max(1, Math.ceil(totalReg / porPagina));
    if (pagina > totalPags) pagina = totalPags;
    const inicio = totalReg ? (pagina - 1) * porPagina + 1 : 0;
    const fin = Math.min(pagina * porPagina, totalReg);
    const txt = totalReg
      ? `Mostrando ${inicio.toLocaleString('es-MX')}–${fin.toLocaleString('es-MX')} de ${totalReg.toLocaleString('es-MX')} registros`
      : 'Sin resultados';
    $('#conteo').textContent = txt;
    $('#conteo-bottom').textContent = txt;
    root.querySelectorAll('.pag-info').forEach((el) => { el.textContent = `Página ${pagina} de ${totalPags}`; });
    root.querySelectorAll('.btn-pag[data-dir="-1"]').forEach((b) => { b.disabled = pagina <= 1; });
    root.querySelectorAll('.btn-pag[data-dir="1"]').forEach((b) => { b.disabled = pagina >= totalPags; });
  }

  async function cargar() {
    if (!filas.length) skel();
    else $('#tb').classList.add('cargando');
    try {
      const fl = {}; root.querySelectorAll('[data-filtro]').forEach((s) => { fl[s.dataset.filtro] = s.value || null; });
      const res = await cfg.listar($('#buscar').value.trim() || null, fl, { limite: porPagina, saltar: (pagina - 1) * porPagina });
      filas = Array.isArray(res) ? res : res.items;
      totalReg = Array.isArray(res) ? res.length : res.total;
      actualizarPag();
      $('#tb').innerHTML = filas.length
        ? filas.map((x) => `<tr>${cfg.columnas.map((c) => `<td>${c.html ? c.fn(x) : esc(c.fn(x))}</td>`).join('')}
            <td><div class="td-actions"><button type="button" class="sec sm" data-e="${x.id}">Editar</button><button type="button" class="peligro sm" data-d="${x.id}">Eliminar</button></div></td></tr>`).join('')
        : `<tr><td colspan="${cols}" class="empty-cell">No hay registros que coincidan con la búsqueda. Prueba limpiar los filtros o cambiar el texto.</td></tr>`;
    } catch (e) { msg(e.message, true); $('#tb').innerHTML = ''; }
    finally { $('#tb').classList.remove('cargando'); }
  }

  // Combobox de búsqueda dinámica
  const combos = {};
  cfg.campos.filter((c) => c.buscar).forEach((c) => {
    const wrap = f.querySelector(`[data-combo="${c.n}"]`);
    const hid = wrap.querySelector('input[type="hidden"]');
    const txt = wrap.querySelector('.combo-in');
    const list = wrap.querySelector('.combo-list');
    let timer = null, seq = 0;
    const buscarOps = async (q) => {
      const mi = ++seq;
      list.hidden = false;
      list.innerHTML = '<div class="combo-empty">Buscando...</div>';
      try {
        const ops = await c.buscar(q);
        if (mi !== seq) return;
        list.innerHTML = ops.length
          ? ops.map(([v, t]) => `<button type="button" class="combo-opt" data-val="${esc(v)}">${esc(t)}</button>`).join('')
          : '<div class="combo-empty">Sin coincidencias</div>';
      } catch {
        if (mi === seq) list.innerHTML = '<div class="combo-empty">Error al buscar</div>';
      }
    };
    txt.onfocus = () => { if (!list.childElementCount || !txt.value.trim()) buscarOps(txt.value.trim()); else list.hidden = false; };
    txt.oninput = () => {
      hid.value = '';
      clearTimeout(timer);
      timer = setTimeout(() => buscarOps(txt.value.trim()), 200);
    };
    list.addEventListener('mousedown', (ev) => {
      const opt = ev.target.closest('.combo-opt'); if (!opt) return;
      ev.preventDefault();
      hid.value = opt.dataset.val;
      txt.value = opt.textContent;
      list.hidden = true;
    });
    txt.onblur = () => { setTimeout(() => { list.hidden = true; }, 120); };
    combos[c.n] = { set: (val, label) => { hid.value = val || ''; txt.value = label || ''; list.hidden = true; }, label: c.label };
  });

  function leer() {
    const o = {};
    for (const c of cfg.campos) {
      let v = f[c.n].value;
      if (c.buscar && c.req && !v) throw new Error(`Selecciona una opción de la lista en "${c.label}".`);
      if (v === '') continue;
      if (c.tipo === 'number') v = Number(v);
      if (c.bool) v = v === 'true';
      o[c.n] = v;
    }
    return o;
  }

  const limpiarCombos = () => Object.values(combos).forEach((cb) => cb.set('', ''));
  const cerrar = () => { f.reset(); limpiarCombos(); f.id.value = ''; $('#form-titulo').textContent = `Nuevo ${singular}`; $('#guardar').textContent = `Guardar ${singular}`; panel.hidden = true; };

  $('#btn-nuevo').onclick = async () => {
    if (!panel.hidden && !f.id.value) { cerrar(); return; }
    panel.hidden = false;
    await asegurarOpciones();
    f.reset(); limpiarCombos(); f.id.value = ''; $('#form-titulo').textContent = `Nuevo ${singular}`; $('#guardar').textContent = `Guardar ${singular}`;
  };
  $('#cerrar-form').onclick = cerrar;
  $('#cancelar').onclick = cerrar;

  f.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const btn = $('#guardar'); btn.disabled = true;
    try {
      const input = leer();
      if (f.id.value) { await cfg.actualizar(f.id.value, input); msg('Registro actualizado correctamente.'); }
      else { await cfg.crear(input); msg('Registro creado correctamente.'); }
      cerrar(); cargar();
    } catch (e) { msg(e.message, true); } finally { btn.disabled = false; }
  });

  $('#buscar').oninput = () => { clearTimeout(window.__t); window.__t = setTimeout(() => { pagina = 1; cargar(); }, 280); };
  root.querySelectorAll('[data-filtro]').forEach((s) => { s.onchange = () => { pagina = 1; cargar(); }; });
  $('#limpiar').onclick = () => { $('#buscar').value = ''; root.querySelectorAll('[data-filtro]').forEach((s) => { s.value = ''; }); pagina = 1; cargar(); };
  $('#por-pagina').onchange = (e) => { porPagina = Number(e.target.value); pagina = 1; cargar(); };

  root.querySelectorAll('.btn-pag').forEach((b) => {
    b.onclick = () => {
      const totalPags = Math.max(1, Math.ceil(totalReg / porPagina));
      const next = pagina + Number(b.dataset.dir);
      if (next < 1 || next > totalPags) return;
      pagina = next;
      cargar();
    };
  });

  $('#tb').addEventListener('click', async (ev) => {
    const b = ev.target.closest('button, .mono-id'); if (!b) return;
    if (b.classList.contains('mono-id')) {
      navigator.clipboard?.writeText(b.dataset.copy || b.textContent);
      msg(`ID copiado: ${b.dataset.copy || b.textContent}`);
      return;
    }
    const x = (id) => filas.find((r) => r.id === id);
    if (b.dataset.d) {
      if (!confirm('¿Eliminar este registro de forma permanente?')) return;
      try { await cfg.eliminar(b.dataset.d); msg('Registro eliminado.'); cargar(); } catch (e) { msg(e.message, true); }
    }
    if (b.dataset.e) {
      const r = x(b.dataset.e);
      panel.hidden = false;
      await asegurarOpciones();
      f.id.value = r.id;
      cfg.campos.forEach((c) => {
        const val = cfg.valor ? cfg.valor(r, c.n) : (r[c.n] ?? '');
        if (combos[c.n]) {
          const [id, lbl] = Array.isArray(val) ? val : [val, val];
          combos[c.n].set(id, lbl);
        } else {
          f[c.n].value = val;
        }
      });
      $('#form-titulo').textContent = `Editar ${singular}`;
      $('#guardar').textContent = 'Guardar cambios';
      panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });
  cargar();
}
