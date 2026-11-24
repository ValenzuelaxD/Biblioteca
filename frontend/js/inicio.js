import { gql, esc } from './api.js';

const iconos = {
  libros: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
  autores: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
  usuarios: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  prestamos: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
  resenas: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
};

const enlaces = { libros: 'libros.html', autores: 'autores.html', usuarios: 'usuarios.html', prestamos: 'prestamos.html', resenas: 'consultas.html' };
const nombres = { autores: 'Autores', libros: 'Libros', usuarios: 'Usuarios', prestamos: 'Préstamos', resenas: 'Reseñas' };

const curiosidades = [
  {
    titulo: '¿Sabías que Solón Argüello no era mexicano?',
    texto: 'Aunque es uno de los personajes más homenajeados en Tepic, José Solón Argüello Escobar nació en León, Nicaragua (en 1879). Llegó a Tepic tras ser exiliado de su país por oponerse al régimen nicaragüense, y aquí encontró su hogar como profesor normalista, poeta y periodista.',
  },
  {
    titulo: 'Del gis y los libros a la Revolución Mexicana',
    texto: 'En Tepic fue maestro y director de escuela, pero su activismo político provocó que en 1908 las autoridades porfiristas lo enviaran como juez a lugares entonces muy aislados como Santiago Ixcuintla y La Yesca. Más tarde se unió a Francisco I. Madero, convirtiéndose en su secretario particular en Palacio Nacional.',
  },
  {
    titulo: 'Un final de película',
    texto: 'Tras el asesinato de Madero en 1913, Solón Argüello se unió al Ejército Constitucionalista de Venustiano Carranza, combatió en la sierra de Nayarit y planeó un atentado contra Victoriano Huerta en la Ciudad de México. Fue capturado y fusilado a los 34 años.',
    cita: '“Acercadme el reflector: quiero que todos veáis este pecho que tantas veces combatió por la libertad.”',
  },
  {
    titulo: 'El pulmón cultural de La Alameda',
    texto: 'Al estar enclavada dentro del Parque La Alameda —uno de los espacios públicos más antiguos y tradicionales de la capital nayarita—, ha funcionado por décadas no solo como centro de estudio para generaciones de estudiantes tepiqueños, sino como un refugio de lectura rodeado de naturaleza en pleno centro histórico.',
  },
  {
    titulo: 'Un edificio con varias vidas',
    texto: 'El recinto ha pasado por importantes etapas de remodelación y rescate arquitectónico —destacando su reconstrucción integral entre 2020 y 2021, y su reapertura renovada en enero de 2024— para modernizar sus salas de lectura y consolidarse como un espacio cultural abierto a talleres y exposiciones.',
  },
];

const servicios = [
  { nombre: 'Sala general y de consulta', detalle: 'Espacios renovados de lectura, estudio e investigación.' },
  { nombre: 'Sala para invidentes / tiflotecnia', detalle: 'Área especializada orientada a la accesibilidad e inclusión.' },
  { nombre: 'Ludoteca y Sala Infantil', detalle: 'Actividades lúdicas y primeras lecturas para niñas y niños.' },
  { nombre: 'Videoteca y centro cultural', detalle: 'Fomento a la lectura, talleres, proyecciones y exposiciones.' },
  { nombre: 'Préstamo interno y a domicilio', detalle: 'Servicio gratuito mediante credencial de la biblioteca.' },
];

const orden = ['autores', 'libros', 'usuarios', 'prestamos', 'resenas'];
const cache = JSON.parse(sessionStorage.getItem('bib_conteos') || 'null');

document.getElementById('app').innerHTML = `
  <div class="page-head">
    <div>
      <h2>Panel de la Biblioteca</h2>
      <p class="page-sub">Ubicada en el corazón de La Alameda, la Biblioteca Pública Central Estatal conecta la lectura, la cultura y la inclusión.</p>
    </div>
    <a class="btn" href="consultas.html">Ver reportes</a>
  </div>

  <section class="stats-grid">
    ${orden.map((k) => `
      <a class="stat-card" href="${enlaces[k] || '#'}">
        <span class="stat-top"><span>${esc(nombres[k] || k)}</span>${iconos[k] || ''}</span>
        <span class="stat-num" data-stat="${k}">${cache?.[k] != null ? Number(cache[k]).toLocaleString('es-MX') : '—'}</span>
      </a>`).join('')}
  </section>

  <h3 class="section-title">Accesos rápidos</h3>
  <section class="modules-list">
    <div class="mod-card">
      <div><h3>Catálogo de Libros</h3><p>Registra nuevos títulos, consulta existencias y busca por autor, categoría o editorial.</p></div>
      <div><a class="btn sec" href="libros.html">Ir a Libros</a></div>
    </div>
    <div class="mod-card">
      <div><h3>Autores</h3><p>Consulta el directorio de autores por nacionalidad y actualiza su semblanza.</p></div>
      <div><a class="btn sec" href="autores.html">Ir a Autores</a></div>
    </div>
    <div class="mod-card">
      <div><h3>Directorio de Usuarios</h3><p>Administra estudiantes, docentes y visitantes externos con credencial.</p></div>
      <div><a class="btn sec" href="usuarios.html">Ir a Usuarios</a></div>
    </div>
    <div class="mod-card">
      <div><h3>Control de Préstamos</h3><p>Registra salidas y devoluciones, identifica vencimientos y controla multas.</p></div>
      <div><a class="btn sec" href="prestamos.html">Ir a Préstamos</a></div>
    </div>
  </section>

  <section class="about-band" aria-labelledby="acerca-titulo">
    <div class="about-brand">
      <img src="img/logo-solon.png" alt="Logo Biblioteca Pública Central Estatal Solón Argüello" class="about-logo">
      <p class="about-adsc">Adscrita al Consejo Estatal para la Cultura y las Artes de Nayarit (CECAN)</p>
    </div>
    <div class="about-info">
      <h3 id="acerca-titulo">Biblioteca Pública Central Estatal “Solón Argüello Escobar”</h3>
      <p class="about-lead">¿Sabías que contamos con sala para invidentes, ludoteca y préstamo gratuito a domicilio? Explora nuestro catálogo y conoce nuestros espacios.</p>
      <dl class="ficha-dl">
        <div>
          <dt>Ubicación</dt>
          <dd>Av. Ignacio Allende y calle Oaxaca, Parque La Alameda, Col. Centro, C.P. 63000, Tepic, Nayarit.</dd>
        </div>
        <div>
          <dt>Horario de atención</dt>
          <dd>Lunes a viernes de 8:00 a 20:00 hrs.</dd>
        </div>
      </dl>
      <h4 class="sub-heading">Áreas y servicios destacados</h4>
      <ul class="servicios-grid">
        ${servicios.map((s) => `<li><strong>${esc(s.nombre)}</strong><span>${esc(s.detalle)}</span></li>`).join('')}
      </ul>
    </div>
  </section>

  <section class="historia-sec" aria-labelledby="historia-titulo">
    <div class="historia-head">
      <h3 id="historia-titulo" class="section-title">Historia y datos curiosos</h3>
      <p class="page-sub">Más de un siglo de historia detrás de su nombre: conoce al poeta y maestro nicaragüense que adoptó a Tepic como su hogar.</p>
    </div>
    <div class="historia-grid">
      ${curiosidades.map((c) => `
        <article class="curio-card">
          <h4>${esc(c.titulo)}</h4>
          <p>${esc(c.texto)}</p>
          ${c.cita ? `<blockquote>${esc(c.cita)}</blockquote>` : ''}
        </article>`).join('')}
    </div>
  </section>`;

gql('{ conteos }').then((d) => {
  sessionStorage.setItem('bib_conteos', JSON.stringify(d.conteos));
  Object.entries(d.conteos).forEach(([k, v]) => {
    const el = document.querySelector(`[data-stat="${k}"]`);
    if (el) el.textContent = Number(v).toLocaleString('es-MX');
  });
}).catch(() => {});
