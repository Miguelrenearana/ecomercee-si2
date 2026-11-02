# FASES DE IMPLEMENTACIÓN Y CHECKLIST OFICIAL — FASHIONSTORE
### Plataforma SaaS Multitenant E-Commerce (Sistemas 2 - 2026)
**Metodología:** ICONIX Process (UML 2.5+)  
**Alcance Oficial:** 25 Casos de Uso Definitivos (Acordados tras poda estratégica y directrices de cátedra)

---

## 🎯 Presentación 1: Domingo 25/10/2026 (Alcance: 8 Casos de Uso)
**Objetivo Técnico:** Base de la Plataforma SaaS Multitenant, Planes y Cuotas, Aislamiento de Datos por `tenant_id` y Catálogo Offline (IndexedDB / SQLite).

- [x] **`CU01` – Registrar y Gestionar Empresas Contratantes (Tenants)** [Nuevo 2P]
  - *Estado:* 100% Implementado (Backend `p0_saas_plataforma`, base de datos y portal Superadmin `/app/superadmin/tenants`).
- [x] **`CU02` – Gestionar Planes de Suscripción (Básico, Pro, Empresarial) y Cuotas** [Nuevo 2P]
  - *Estado:* 100% Implementado (Planes Básico con 3 sucursales, Profesional con 10 y Empresarial; Downgrade Guard en `/api/saas/subscriptions`).
- [x] **`CU03` – Iniciar Sesión Multitenant con JWT y Claims de Tenant** [Modificado 1P]
  - *Estado:* 100% Implementado (Token JWT firmado inyectando `sub`, `rol`, `tenant_id` y `branch_id`).
- [x] **`CU04` – Gestionar Sucursales Bajo Límites del Plan** [Modificado 1P]
  - *Estado:* 100% Implementado (Validación estricta de cuotas en backend y widget reactivo con geolocalización en `/app/admin/branch`).
- [x] **`CU05` – Gestionar Prendas y Variantes de Precio por Talla** [Modificado 1P]
  - *Estado:* 100% Implementado (CRUD de prendas, matriz de variantes con precios diferenciados por talla en `p2_gestion_productos_catalogo`).
- [x] **`CU06` – Consultar Catálogo Online con Búsqueda Facetada** [Modificado 1P]
  - *Estado:* 100% Implementado (Filtros facetados multicriterio por categoría, talla y color en tienda pública).
- [x] **`CU07` – Sincronizar y Descargar Catálogo a Almacenamiento Local (PWA / SQLite)** [Nuevo 2P]
  - *Estado:* 100% Implementado (Endpoint `/api/catalog/offline-pack`, persistencia IndexedDB nativa en Angular y SQLite en Flutter).
- [x] **`CU08` – Consultar Catálogo Offline en Modo Desconectado** [Nuevo 2P]
  - *Estado:* 100% Implementado (Detección reactiva de red con `NetworkStatusService` y consulta transparente de catálogo en caché local).

---

## 🎯 Presentación 2: Domingo 01/11/2026 (Alcance Acumulado: 18 Casos de Uso)
**Objetivo Técnico:** Compras Digitales Stripe, Reservas con Expiración (Online y Offline), Ventas Desconectadas, Sincronización Idempotente, Resolución de Conflictos y Políticas de Cambio/Devolución.

> **Consolidación Definitiva de Base de Datos:** La migración maestra `0044` completó y congeló todas las tablas, columnas, relaciones e índices para los 25 Casos de Uso en PostgreSQL (`alembic upgrade head`).

- [x] **`CU09` – Comprar Prendas con Stripe y Despacho Condicionado** [Modificado 1P]
  - *Estado:* 100% Implementado (Backend `p4`, Frontend Web y Mobile Flutter; cumplimiento estricto de Política 3 de despacho con tracking `DSP-...`).
- [x] **`CU10` – Crear Reserva Online de Prendas con Vencimiento y Bloqueo** [Modificado 1P]
  - *Estado:* 100% Implementado (Backend `p4` con bloqueo atómico `reserved_quantity`, código `RES-XXXXXXXX`, QR y vista boutique en Angular).
- [x] **`CU11` – Registrar Reserva de Prendas Offline en Modo Desconectado (PWA / SQLite)** [Nuevo 2P]
  - *Estado:* 100% Implementado (Backend `p4` con `client_reservation_id` e idempotencia, PWA Angular con `IdbReservationsService` y Outbox offline, Flutter con `LocalCatalogDb` tabla SQLite `local_pending_reservations`, tray de reservas pendientes y sincronización).
- [x] **`CU12` – Atender y Resolver Conflictos de Reservas Expiradas** [Nuevo 2P]
  - *Estado:* 100% Implementado (Backend `p4` con endpoints `/reservations/branch/conflicts` y `/resolve-conflict`, validación de inventario en percha, reactivación con re-bloqueo +24h/48h, sustitución de variante, anulación con nota de auditoría, frontend PWA en `/app/encargado/reservations` con bandeja de conflictos reactiva y modal de resolución, suite de 7/7 pruebas unitarias pasando).
- [ ] **`CU13` – Registrar Venta POS Desconectada en Efectivo con Contingencia UUIDv4** [Nuevo 2P]
  - *Criterio de éxito:* Cobro forzado exclusivamente en EFECTIVO (Política 5), emisión de ticket de contingencia con UUIDv4 y rebaja local en caché.
- [ ] **`CU14` – Gestionar Bandeja Local de Operaciones Pendientes (Outbox PWA / SQLite)** [Nuevo 2P]
  - *Criterio de éxito:* Vista outbox con listado de tickets en estado `PENDIENTE_SYNC`, badge ámbar y botón para forzar sincronización.
- [ ] **`CU15` – Sincronizar Lotes de Ventas con Idempotencia Central (`sync_operations`)** [Nuevo 2P]
  - *Criterio de éxito:* Endpoint `/api/sales/offline/batch-sync`; verificación contra `sync_operations` para evitar duplicar ventas o descontar stock dos veces.
- [ ] **`CU16` – Gestionar y Resolver Conflictos de Ventas Offline y Quiebres de Stock** [Nuevo 2P]
  - *Criterio de éxito:* Detección de ventas offline con stock central agotado; pantalla para que el Encargado resuelva (stock negativo, sustituto o nota de crédito).
- [ ] **`CU17` – Procesar Cambio de Prenda por Talla con Cobro de Diferencia y Estado** [Nuevo 2P]
  - *Criterio de éxito:* Cumplimiento de la Política 1 (abono obligatorio de diferencia $\Delta$) e inspección de etiqueta textil intacta (rechazo si está usada).
- [ ] **`CU18` – Procesar Devolución de Prenda con Retención Operativa y Nota de Crédito** [Nuevo 2P]
  - *Criterio de éxito:* Cumplimiento de la Política 2 (retención 20%-50%, reembolso neto 50%-80%) y emisión de Nota de Crédito digital (`NC-YYYYMMDD-XXXX`).

---

## 🎯 Presentación 3: Domingo 08/11/2026 (Alcance Acumulado: 25 Casos de Uso TOTALES)
**Objetivo Técnico:** Geolocalización Móvil (OpenStreetMap), IA Generativa con Voz (Gemini RAG), Pipeline de Machine Learning (Supervisado/No Supervisado) y Dashboard Analítico.

- [ ] **`CU19` – Localizar Sucursales y Trazar Rutas (OpenStreetMap / ORS)** [Nuevo 2P]
  - *Criterio de éxito:* Mapa interactivo en Flutter con `flutter_map` y cálculo de rutas a pie/vehículo con OpenRouteService.
- [ ] **`CU20` – Generar Reportes Ejecutivos por Voz y Lenguaje Natural (Gemini RAG)** [Nuevo 2P]
  - *Criterio de éxito:* Consulta gerencial mediante micrófono, contextualización RAG multitenant con Gemini y respuesta hablada (TTS) + gráficos.
- [ ] **`CU21` – Exportar Reportes Empresariales a Formatos PDF y Excel** [Modificado 1P]
  - *Criterio de éxito:* Descarga dinámica de balances contables, inventario y ventas en archivos PDF con membrete y planillas Excel (.xlsx).
- [ ] **`CU22` – Generar Dataset Sintético de Ventas y Estacionalidad** [Nuevo 2P]
  - *Criterio de éxito:* Generador estocástico Python (`numpy`/`pandas`) de 10,000+ transacciones simuladas con estacionalidad de moda textil.
- [ ] **`CU23` – Predecir Demanda de Ropa (ML Supervisado)** [Nuevo 2P]
  - *Criterio de éxito:* Modelo de regresión Scikit-Learn (`RandomForestRegressor`) para estimar demanda por talla a 4 semanas ($R^2 \ge 0.82$).
- [ ] **`CU24` – Segmentar Clientes con K-Means (ML No Supervisado)** [Nuevo 2P]
  - *Criterio de éxito:* Algoritmo K-Means con 3-4 clusters automáticos según métricas RFM (Recencia, Frecuencia, Monto) y tasa de devoluciones.
- [ ] **`CU25` – Visualizar Dashboard Ejecutivo con KPIs y Métricas ML** [Modificado 1P]
  - *Criterio de éxito:* Tablero de comando en tiempo real con tarjetas métricas, gráficas interactivas y proyecciones de analítica predictiva.

---

## 🏆 Defensa Final: Martes 10 de Noviembre de 2026 (07:00 AM)
- [ ] Verificación integral de los **25 Casos de Uso** funcionando de extremo a extremo en ambiente productivo accesible en la nube.
- [ ] Coherencia documental al 100% entre modelos UML (ICONIX), esquemas de base de datos relacional y código fuente.
