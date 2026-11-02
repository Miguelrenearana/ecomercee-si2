# NEXT STEPS — FASHIONSTORE SAAS MULTITENANT
### Hoja de Ruta Operativa y Próximos Pasos (25 Casos de Uso Oficiales)
**Fecha:** 31 de Octubre de 2026

---

## 🎯 Estado de Situación: 11 de 25 Casos de Uso Implementados (100% Verificados)

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

---

## 🚀 Tareas Inmediatas de Implementación (Presentación 2)

### Bloque A: Reservas Offline y Resolución de Expiraciones (`CU11` y `CU12`)
1. **`CU11` – Registrar Reserva de Prendas Offline en Modo Desconectado (PWA / SQLite):** (Completado)
   - [x] Conectar la bandeja de reservas offline de `idb-reservations.service.ts` en Angular con el detector de red.
   - [x] Implementar la persistencia SQLite en Flutter para apartado desconectado y bandeja de salida outbox.
2. **`CU12` – Atender y Resolver Conflictos de Reservas Expiradas:** (Siguiente Tarea)
   - [ ] Tarea periódica de expiración (`order_service.py` / `expire_daily.py`), endpoints de resolución `/api/reservations/{id}/resolve`.
   - [ ] Frontend Web: Panel de Encargado de Sucursal para liberar prendas no retiradas a stock general.

---

### Bloque B: Suite POS Offline, Sincronización Idempotente y Conflictos (`CU13` al `CU16`)
1. **`CU13` – Registrar Venta POS Desconectada en Efectivo con Contingencia UUIDv4:**
   - [ ] Frontend PWA (`/app/cajero/caja`): Bloqueo estricto a forma de pago EFECTIVO (Política 5).
   - [ ] Generación de UUIDv4 local, rebaja inmediata en stock IndexedDB/SQLite y ticket de contingencia.
2. **`CU14` – Gestionar Bandeja Local de Operaciones Pendientes (Outbox PWA / SQLite):**
   - [ ] Pestaña Outbox en caja con lista de ventas locales `PENDIENTE_SYNC` y badge dinámico ámbar.
3. **`CU15` – Sincronizar Lotes de Ventas con Idempotencia Central (`sync_operations`):**
   - [ ] Endpoint backend `POST /api/sales/offline/batch-sync` validando contra tabla `sync_operations`.
   - [ ] Prevención de doble inserción de ventas y doble descuento de inventario ante reintentos de red.
4. **`CU16` – Gestionar y Resolver Conflictos de Ventas Offline y Quiebres de Stock:**
   - [ ] Detección en backend de ventas offline sincronizadas con stock central insuficiente (sobreventa).
   - [ ] Pantalla en panel de Encargado para resolver: autorizar con stock negativo, sustituir prenda o emitir Nota de Crédito.

---

### Bloque C: Políticas Comerciales de Cambio y Devolución (`CU17` y `CU18`)
1. **`CU17` – Procesar Cambio de Prenda por Talla con Cobro de Diferencia y Estado:**
   - [ ] Endpoint `POST /api/sales/exchanges` validando Política 1 (abono estricto de diferencia $\Delta$).
   - [ ] Verificación física en caja: casilla de etiqueta textil y estado no desgastado (rechazo si no cumple).
2. **`CU18` – Procesar Devolución de Prenda con Retención Operativa y Nota de Crédito:**
   - [ ] Endpoint `POST /api/sales/returns` aplicando retención del 20% al 50% según la política del tenant.
   - [ ] Emisión de Nota de Crédito Digital (`NC-YYYYMMDD-XXXX`) o reembolso en efectivo.

---

## 📋 Ajuste Menor Requerido en Base de Datos / Seed:
- [ ] Actualizar en base de datos la cuota del **Plan BÁSICO** de 2 a **3 sucursales activas** (`UPDATE plans SET max_branches = 3 WHERE code = 'basic'`).
- [ ] Insertar el **Plan EMPRESARIAL** en `plans` (código `enterprise`, max_branches 25, con IA y backup continuo).
