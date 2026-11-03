# NEXT STEPS — FASHIONSTORE SAAS MULTITENANT
### Hoja de Ruta Operativa y Próximos Pasos (25 Casos de Uso Oficiales)
**Fecha:** 31 de Octubre de 2026

---

## 🎯 Estado de Situación: 16 de 25 Casos de Uso Implementados (100% Verificados)

### Casos de Uso Listos y Funcionales:
- [x] **`CU01` – Registrar y Gestionar Empresas Contratantes (Tenants)** (`p0_saas_plataforma`)
- [x] **`CU02` – Gestionar Planes de Suscripción (Básico a 3 suc., Pro a 10 suc., Empresarial) y Cuotas** (`p0_saas_plataforma`)
- [x] **`CU03` – Iniciar Sesión Multitenant con JWT y Claims de Tenant** (`p1_gestion_usuarios_acceso`)
- [x] **`CU04` – Gestionar Sucursales Bajo Límites del Plan** (`p1_gestion_usuarios_acceso`)
- [x] **`CU05` – Gestionar Prendas y Variantes de Precio por Talla** (`p2_gestion_productos_catalogo`)
- [x] **`CU06` – Consultar Catálogo Online con Búsqueda Facetada** (`p2_gestion_productos_catalogo`)
- [x] **`CU07` – Sincronizar y Descargar Catálogo a Almacenamiento Local (PWA / SQLite)** (`p3_gestion_inventario_disponibilidad`)
- [x] **`CU08` – Consultar Catálogo Offline en Modo Desconectado** (`p3_gestion_inventario_disponibilidad`)
- [x] **`CU09` – Comprar Prendas con Stripe y Despacho Condicionado** (`p4_gestion_compras_reservas`)
- [x] **`CU10` – Crear Reserva Online de Prendas con Vencimiento y Bloqueo** (`p4_gestion_compras_reservas`)
- [x] **`CU11` – Registrar Reserva de Prendas Offline en Modo Desconectado (PWA / SQLite)** (`p4_gestion_compras_reservas`)
- [x] **`CU12` – Atender y Resolver Conflictos de Reservas Expiradas** (`p4_gestion_compras_reservas`)
- [x] **`CU13` – Registrar Venta POS Desconectada en Efectivo con Contingencia UUIDv4** (`p5_gestion_ventas_pos`)
- [x] **`CU14` – Gestionar Bandeja Local de Operaciones Pendientes (Outbox PWA / SQLite)** (`p5_gestion_ventas_pos`)
- [x] **`CU17` – Procesar Cambio de Prenda por Talla con Cobro de Diferencia y Estado** (`p5_gestion_ventas_pos`)
- [x] **`CU18` – Procesar Devolución de Prenda con Retención Operativa y Nota de Crédito** (`p5_gestion_ventas_pos`)

---

## 🚀 Tareas Inmediatas de Implementación (Presentación 2)

### Bloque B: Suite POS Offline, Sincronización Idempotente y Conflictos (`CU14` al `CU16`)
1. **`CU14` – Gestionar Bandeja Local de Operaciones Pendientes (Outbox PWA / SQLite):** (Completado)
   - [x] Pestaña Outbox en caja con lista de ventas locales `PENDIENTE_SYNC`, tarjetas de métricas en vivo y arqueo de efectivo offline.
   - [x] Sincronización unitaria, sincronización en lote, purga de sincronizadas y verificación contra servidor `POST /api/sales/offline/check-status`.
2. **`CU15` – Sincronizar Lotes de Ventas con Idempotencia Central (`sync_operations`):** (Siguiente Tarea Inmediata)
   - [ ] Endpoint backend `POST /api/sales/offline/batch-sync` validando contra tabla `sync_operations`.
   - [ ] Prevención de doble inserción de ventas y doble descuento de inventario ante reintentos de red.
3. **`CU16` – Gestionar y Resolver Conflictos de Ventas Offline y Quiebres de Stock:**
   - [ ] Detección en backend de ventas offline sincronizadas con stock central insuficiente (sobreventa).
   - [ ] Pantalla en panel de Encargado para resolver: autorizar con stock negativo, sustituir prenda o emitir Nota de Crédito.

---

### Bloque C: Políticas Comerciales de Cambio y Devolución (`CU17` y `CU18`) — 100% COMPLETADO
1. **`CU17` – Procesar Cambio de Prenda por Talla con Cobro de Diferencia y Estado:** (Completado)
   - [x] Endpoints `POST /api/exchanges/quote`, `POST /api/exchanges` y `GET /api/exchanges` validando Política 1 (abono estricto de diferencia $\Delta$).
   - [x] Verificación física de prenda: casilla de etiqueta textil intacta y prenda no usada (`good_with_tags`).
   - [x] Actualización transaccional atómica de stock físico (+1 / -1 con `with_for_update`) y persistencia en `garment_exchanges`.
   - [x] Suite de integración `test_cu17_garment_exchange.py` con 8/8 pruebas aprobadas (100%).
2. **`CU18` – Procesar Devolución de Prenda con Retención Operativa y Nota de Crédito:** (Completado)
   - [x] Endpoints `POST /api/returns/quote`, `POST /api/returns` y `GET /api/returns` aplicando retención del 20% al 50% según la política del tenant.
   - [x] Emisión de Nota de Crédito Digital (`NC-YYYYMMDD-XXXX`) o liquidación en efectivo.
   - [x] Reingreso físico de inventario atómico con bloqueo pesimista `with_for_update`.
   - [x] Frontend Web PWA Angular en `/app/cajero/caja` con cotización previa y comprobante modal.
   - [x] Suite automatizada `test_cu18_garment_return.py` con 8/8 pruebas aprobadas (100%).
   - [x] Diagramas de Robustez y Secuencia para Enterprise Architect v15 en `docsUML/`.

---

## 📋 Ajuste Menor Requerido en Base de Datos / Seed:
- [ ] Actualizar en base de datos la cuota del **Plan BÁSICO** de 2 a **3 sucursales activas** (`UPDATE plans SET max_branches = 3 WHERE code = 'basic'`).
- [ ] Insertar el **Plan EMPRESARIAL** en `plans` (código `enterprise`, max_branches 25, con IA y backup continuo).
