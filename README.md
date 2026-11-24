# Biblioteca Solón · Sistema de Gestión Bibliotecaria

> Proyecto final de **Bases de Datos NoSQL** — MongoDB Atlas + Mongoose + Apollo Server (GraphQL) + frontend JavaScript sin frameworks.

Sistema web para la **Biblioteca Pública Central Estatal "Solón Argüello Escobar"** (CECAN, Parque La Alameda, Tepic, Nayarit): catálogo de libros, autores, usuarios, préstamos, multas y **30 reportes analíticos** construidos con el pipeline de agregación de MongoDB.

**Autores:** Jose Valenzuela, Jorge Silva y Jesús Flores

---

## 1. Estado del proyecto

| Componente | Estado |
|---|---|
| Modelo de datos (5 colecciones × 1000 documentos) | ✅ Implementado |
| API GraphQL (16 queries + 12 mutations) | ✅ Implementado |
| 30 consultas de agregación (10 por área) | ✅ Implementado |
| 4 pantallas CRUD + dashboard + reportes | ✅ Implementado |
| Búsqueda, filtros y paginación en servidor | ✅ Implementado |
| Tests automatizados | ⚠️ Smoke test manual (`test.js`); `npm test` es un stub |

---

## 2. Stack

| Capa | Tecnología | Versión |
|---|---|---|
| Runtime | Node.js (ES Modules) | 24.x |
| Base de datos | MongoDB Atlas + Mongoose | 9.13 |
| API | Apollo Server + `@as-integrations/express5` | 5.5 / 1.1 |
| Servidor HTTP | Express | 5.3 |
| Lenguaje de consulta | GraphQL | 16.15 |
| Datos de prueba | `@faker-js/faker` (locale `es`) | 10.6 |
| Frontend | HTML5 + CSS3 + JavaScript vanilla (módulos ES) | — |

Sin bundler ni framework de UI: el frontend son módulos ES nativos servidos por Express.

---

## 3. Funcionalidades

- **Dashboard** (`index.html`): conteos en vivo de las 5 colecciones, accesos rápidos, ficha de la biblioteca e historia de Solón Argüello.
- **4 CRUD completos**: libros, autores, usuarios y préstamos, con alta, edición, baja y confirmación.
- **Tabla reutilizable**: búsqueda con *debounce*, filtros por columna, selector de tamaño de página (5/10/20/50/200), paginación superior e inferior, *skeleton loading* y estados vacíos.
- **Combobox con búsqueda remota** para relaciones (`libro → autor`, `préstamo → libro/usuario`), sin cargar catálogos completos.
- **30 reportes** (`consultas.html`): agrupados por área, filtrables, con salida en tabla legible o JSON técnico.
- **Sesión de usuario**: chip en la cabecera y modal de inicio de sesión.
- **Diseño responsive** con tipografías Newsreader / Source Sans 3 / JetBrains Mono.

---

## 4. Arquitectura

```
┌──────────────────────────────┐
│  Navegador (frontend/)       │  HTML + CSS + módulos ES
│  fetch() → POST /graphql     │
└──────────────┬───────────────┘
               │ JSON GraphQL
┌──────────────▼───────────────┐
│  Express 5 (:4000)           │
│  ├─ /graphql  → Apollo 5     │  typeDefs + resolvers
│  └─ /         → estáticos    │  sirve ../frontend
└──────────────┬───────────────┘
               │ Mongoose 9 (ODM)
┌──────────────▼───────────────┐
│  MongoDB Atlas (M0)          │  5 colecciones · 1000 docs c/u
└──────────────────────────────┘
```

Un único endpoint (`POST /graphql`) expone lectura, escritura y ejecución de reportes; el mismo proceso Express sirve el frontend, así que **todo corre en http://localhost:4000**.

---

## 5. Estructura del proyecto

```
Biblioteca/
├── backend/
│   ├── models.js       # 5 esquemas Mongoose (Autor, Libro, Usuario, Prestamo, Resena)
│   ├── server.js       # typeDefs, resolvers, Express + Apollo, estáticos
│   ├── queries.js      # catálogo declarativo de 30 pipelines de agregación
│   ├── seed.js         # 1000 documentos por colección con Faker (es)
│   ├── test.js         # smoke test: ejecuta las 30 consultas + ciclo CRUD
│   ├── .env            # MONGODB_URI y PORT (no versionado)
│   └── package.json
├── frontend/
│   ├── index.html      # dashboard + información de la biblioteca
│   ├── libros.html     # CRUD libros        (L01–L10)
│   ├── autores.html    # CRUD autores
│   ├── usuarios.html   # CRUD usuarios      (U01–U10)
│   ├── prestamos.html  # CRUD préstamos     (P01–P10)
│   ├── consultas.html  # 30 reportes
│   ├── css/estilos.css # sistema visual completo
│   ├── img/logo-solon.png
│   └── js/
│       ├── api.js      # cliente GraphQL + componente CRUD config-driven
│       ├── inicio.js   # dashboard
│       ├── libros.js / autores.js / usuarios.js / prestamos.js
│       └── consultas.js
└── README.md
```

---

## 6. Puesta en marcha

**Requisitos:** Node.js 20+ y un cluster de MongoDB Atlas accesible (o MongoDB local).

```bash
cd backend
npm install

# .env  (credenciales de conexión)
# MONGODB_URI="mongodb+srv://usuario:password@cluster/biblioteca"
# PORT=4000

npm run seed     # ⚠️ borra y recarga: 1000 docs en cada colección
npm start        # http://localhost:4000  → frontend
                 # http://localhost:4000/graphql → API
```

| Variable | Obligatoria | Descripción |
|---|---|---|
| `MONGODB_URI` | Sí | Cadena de conexión de Atlas/local. |
| `PORT` | No | Puerto HTTP; por defecto `4000`. |

> ⚠️ `npm run seed` ejecuta `deleteMany({})` sobre las 5 colecciones antes de insertar. No lo corras contra una base con datos reales.

**Verificación rápida** (con el servidor levantado, en otra terminal):

```bash
node backend/test.js
```

Ejecuta las 30 consultas y un ciclo CRUD de autor; imprime el total de cada reporte y cuántas fallaron.

---

## 7. API GraphQL

Endpoint único: `POST http://localhost:4000/graphql`.

```graphql
# Ejemplo de lectura
query {
  libros(limite: 5, buscar: "sombra", soloDisponibles: true) {
    id titulo disponibles autor { nombre }
  }
  totalLibros(buscar: "sombra", soloDisponibles: true)
}

# Ejemplo de escritura
mutation {
  crearPrestamo(input: { libro: "<id>", usuario: "<id>", fechaVencimiento: "2026-12-05" }) {
    id estado fechaPrestamo
  }
}
```

### Queries (16)

| Grupo | Consultas |
|---|---|
| Autores | `autores`, `totalAutores`, `autor(id)` |
| Libros | `libros`, `totalLibros`, `libro(id)` |
| Usuarios | `usuarios`, `totalUsuarios`, `usuario(id)` |
| Préstamos | `prestamos`, `totalPrestamos`, `prestamo(id)` |
| Reseñas | `resenas(limite)` |
| Sistema | `conteos`, `consultas(integrante)`, `ejecutarConsulta(id)` |

### Mutations (12)

`crear|actualizar|eliminar` × `Autor`, `Libro`, `Usuario`, `Prestamo`. Las reseñas solo se leen (vienen del *seed*).

### Detalles de implementación

- Escalar `JSON` propio para devolver documentos de agregación sin tipar cada reporte.
- `conteos` cachea 30 s en memoria y usa `estimatedDocumentCount()`; se invalida al crear/eliminar.
- Búsqueda con `$regex` **escapada** (`rx()`), insensible a mayúsculas (`$options: 'i'`).
- Límites acotados: `limite` ∈ [1, 1000]; `saltar` ≥ 0.
- `ejecutarConsulta` valida el `id` contra una lista blanca: nunca ejecuta pipelines arbitrarios del cliente.
- `Libro.autor`, `Prestamo.libro/usuario` y `Resena.*` se resuelven con `populate` o `$lookup`, con resolvers que toleran datos ya poblados.

---

## 8. Modelo de datos

| Colección | Campos principales | Relaciones |
|---|---|---|
| `autores` | `nombre`*, `nacionalidad`, `anioNacimiento`, `biografia` | 1 → N libros |
| `libros` | `titulo`*, `isbn`, `categoria`, `editorial`, `anioPublicacion`, `paginas`, `ejemplares`, `disponibles` | N → 1 autor; 1 → N préstamos/reseñas |
| `usuarios` | `nombre`*, `correo` (único), `tipo` (`estudiante`/`docente`/`externo`), `carrera`, `activo`, `fechaRegistro` | 1 → N préstamos/reseñas |
| `prestamos` | `libro`*, `usuario`*, `fechaPrestamo`, `fechaVencimiento`, `fechaDevolucion`, `estado` (`activo`/`devuelto`/`vencido`), `multa` | N → 1 libro, N → 1 usuario |
| `resenas` | `libro`*, `usuario`*, `calificacion` (1–5), `comentario`, `fecha` | N → 1 libro, N → 1 usuario |

`*` = obligatorio. `timestamps: true` en `autores` y `libros`.

**Volumen del seed:** 1000 autores, 1000 libros, 1000 usuarios, 1000 préstamos (≈70 % devueltos, multa de $5/día de retraso) y 1000 reseñas.

---

## 9. Los 30 reportes

Cada reporte se declara en `backend/queries.js` como `{ id, integrante, titulo, descripcion, modelo, pipeline() }`, donde `integrante` identifica el área (Libros, Usuarios o Préstamos), de modo que agregar uno nuevo no requiere tocar resolvers.

### Libros — L01 a L10
| ID | Reporte | Técnica destacada |
|---|---|---|
| L01 | Top 10 libros más prestados con su autor | `$group` + `$lookup` + `$unwind` |
| L02 | Calificación promedio por categoría | `$lookup` + `$avg` + `$round` |
| L03 | Libros sin ningún préstamo | `$lookup` + `$size: 0` |
| L04 | Baja disponibilidad y alta demanda | `$match` + `$addFields` |
| L05 | Desempeño por editorial | doble `$lookup` + promedios |
| L06 | Participación por década y categoría | `$setWindowFields` (`partitionBy`) |
| L07 | Mejor calificados con ≥ 3 reseñas | `$group` + `$match` + ranking |
| L08 | Ocupación y rotación por categoría | aritmética de agregación |
| L09 | Multas acumuladas por libro | `$sum` + `$cond` |
| L10 | Ratio reseñas / préstamo | doble `$lookup` + `$divide` |

### Usuarios — U01 a U10
| ID | Reporte | Técnica destacada |
|---|---|---|
| U01 | Usuarios más activos | `$group` + top 10 |
| U02 | Préstamos por tipo y estado | matriz con `_id` compuesto |
| U03 | Usuarios con multas pendientes | `$match` sobre suma |
| U04 | Usuarios sin préstamos | `$lookup` + `$size: 0` |
| U05 | Categoría favorita por carrera | doble `$group` + `$first` |
| U06 | Préstamos pendientes por usuario | `$in` + conteo |
| U07 | Crecimiento anual con acumulado | `$setWindowFields` (`documents`) |
| U08 | Reseñadores más prolíficos | `$avg` de calificación |
| U09 | Tasa de retraso por usuario | `$cond` + porcentaje |
| U10 | Resumen integral | `$facet` (3 ramas) |

### Préstamos — P01 a P10
| ID | Reporte | Técnica destacada |
|---|---|---|
| P01 | Tendencia mensual con variación | `$setWindowFields` + `$shift` |
| P02 | Vencidos con días de retraso | `$dateDiff` + `$$NOW` |
| P03 | Duración promedio por categoría | `$dateDiff` + `$avg` |
| P04 | Ingresos por multas por mes | `$year`/`$month` |
| P05 | Carga por día de la semana | `$switch` + ventana |
| P06 | Estado por tipo de usuario (%) | `$setWindowFields` (`partitionBy`) |
| P07 | Acumulado mes a mes | ventana `unbounded → current` |
| P08 | Co-ocurrencia de libros por usuario | `$addToSet` + `$unwind` |
| P09 | Devoluciones anticipadas vs tardías | `$switch` |
| P10 | Panel ejecutivo | `$facet` (estado, multas, top 3) |

---

## 10. Decisiones técnicas

- **MongoDB sobre Neo4j:** la carga es CRUD + analítica agregada con relaciones de un nivel; el pipeline cubre las 30 consultas sin lenguaje extra.
- **GraphQL en lugar de REST:** un solo endpoint evita sobre/sub-consulta en tablas con filtros combinables y permite devolver `JSON` para reportes heterogéneos.
- **Componente CRUD config-driven (`pantallaCRUD`):** las 4 pantallas comparten ~300 líneas de lógica (tabla, formulario, paginación, combobox, mensajes) y cada página solo declara columnas, campos y llamadas GraphQL.
- **Escapado centralizado:** `esc()` en `api.js` se aplica de forma consistente a los datos de usuario (títulos, nombres, correos y el JSON de los reportes).
- **Seed reproducible:** Faker en español genera títulos, biografías y comentarios coherentes; los agregados del seed respetan las invariantes (estado ↔ fechas, multa ↔ retraso).

### MongoDB vs Neo4j (resumen)

| Criterio | MongoDB | Neo4j |
|---|---|---|
| Modelo | Documentos BSON | Nodos y relaciones |
| Consulta | Aggregation Pipeline | Cypher |
| Caso fuerte | CRUD, catálogos, analítica agregada | Recorridos profundos, recomendación |
| En este proyecto | 30 reportes con `$lookup`, `$facet` y ventanas | Solo aportaría en grafos de co-ocurrencia a gran escala |

La biblioteca concentra altas, bajas, cambios y reportes; las relaciones son de un nivel (libro→autor, préstamo→libro/usuario). Un grafo no aportaría ventaja aquí y añadiría un lenguaje extra al proyecto.

---

## 11. Limitaciones conocidas

| Problema | Impacto | Mitigación sugerida |
|---|---|---|
| `findByIdAndUpdate(..., { new: true })` sin `runValidators` | Las ediciones saltan `enum`, `min/max` y `required`; Mongoose 9 ya marca `new` como deprecado (visible en `srv.err`) | `{ returnDocument: 'after', runValidators: true }` |
| Borrar autor/libro deja referencias huérfanas | `$lookup` + `$unwind` descartan filas en silencio → totales incompletos | Validar dependientes antes de borrar o usar `$lookup` tolerante |
| `correo` es `unique` pero opcional y sin `sparse` | El segundo usuario sin correo falla con `E11000` | `sparse: true` o exigir correo |
| Crear un préstamo no descuenta `disponibles` ni marca `vencido` | Stock y estado pueden contradecir la realidad | Capa de servicio/transacción al prestar y devolver |
| `PrestamoInput` no incluye `fechaDevolucion` | No se pueden registrar devoluciones desde la UI; P03/P09 solo reflejan datos del seed | Añadir campo y mutation `devolverPrestamo` |
| P08 no calcula pares exactos de libros | El título promete más de lo que el pipeline entrega | Documentarlo o implementar *self-join* |
| Sin índices en claves foráneas ni fechas | Cada `$lookup`/`populate` es *collection scan* | `.index()` en `libro`, `usuario`, `fechaPrestamo`, `autor` |
| `opcionesCargadas = true` antes del `await` | Si falla la carga de catálogos, no reintenta y el formulario queda sin opciones | Marcar tras el éxito y envolver en `try/catch` |
| `npm test` es un stub | No hay red de seguridad ante regresiones | Migrar `test.js` a `node:test` con aserciones |

---

## 12. Seguridad

Controles que **sí** existen: `$regex` escapada (sin inyección NoSQL ni ReDoS), límites de paginación, *pipelines* en lista blanca, escapado HTML sistemático y estáticos confinados a `/frontend`.

Riesgos a declarar antes de entregar/desplegar:

1. **CORS abierto** (`cors()` sin lista de orígenes).
2. **Credenciales de Atlas en `.env`**: el archivo se versiona para compartirlo; rotar la contraseña después de la entrega y usar un usuario con permisos mínimos e *IP allowlist*.
3. **Sin rate limiting** ni tope para `saltar`; los mensajes de Mongoose y la introspección quedan expuestos.
4. **PII**: los reportes muestran correo y multas de usuarios.

Checklist mínima para producción: CORS restringido, `helmet` + HTTPS, `formatError` genérico, introspección desactivada, *rate limit* y guarda de entorno en `seed.js`.
