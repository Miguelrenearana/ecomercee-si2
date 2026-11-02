# CURRENT STATE — FASHIONSTORE SAAS MULTITENANT
### Plataforma SaaS Multitenant E-Commerce (Sistemas 2 - 2026)
**Fecha de Corte:** 31 de Octubre de 2026  
**Alcance Oficial:** 25 Casos de Uso Definitivos (Consolidados para el 2do Parcial)

---

## 1. Resumen de Estado de Casos de Uso (Total: 25 CUs)

| Estado | Cantidad de CUs | Casos de Uso Comprendidos |
| :--- | :---: | :--- |
| **Implementados y Verificados (100%)** | **15 CUs** | `CU01`, `CU02`, `CU03`, `CU04`, `CU05`, `CU06`, `CU07`, `CU08`, `CU09`, `CU10`, `CU11`, `CU12`, `CU13`, `CU17`, `CU18` |
| **En Curso / Inmediatos (Presentación 2)** | **3 CUs** | `CU14`, `CU15`, `CU16` |
| **Programados (Presentación 3)** | **7 CUs** | `CU19`, `CU20`, `CU21`, `CU22`, `CU23`, `CU24`, `CU25` |

---

### Detalle de Avance de los Casos de Uso Implementados:

1. **`CU01: Registrar y Gestionar Empresas (Tenants)` [Nuevo 2P - 100%]:**  
   Backend `p0_saas_plataforma` con aislamiento por `tenant_id`, tabla `companies`, base de datos central y portal Superadmin operativo en `/app/superadmin/tenants`.
2. **`CU02: Gestionar Planes de Suscripción (Básico, Pro, Empresarial) y Cuotas` [Nuevo 2P - 100%]:**  
   Catálogo de 3 planes (Básico máx. 3 sucursales, Profesional máx. 10 sucursales, Empresarial ilimitado), timestamps de auditoría, Downgrade Guard en `/api/saas/subscriptions` y modal reactivo de cambio de plan.
3. **`CU03: Iniciar Sesión Multitenant con JWT y Claims de Tenant` [Modificado 1P - 100%]:**  
   Token JWT con inyección obligatoria de `sub`, `rol`, `tenant_id` y `branch_id`. Login desacoplado de dependencias externas en `environment.ts` y selector de 2 actores (`Clientes` vs `Administrativos`).
4. **`CU04: Gestionar Sucursales Bajo Límites del Plan` [Modificado 1P - 100% Blindado]:**  
   Migración `0040` (geolocalización y auditoría), endpoints `/api/branches/quota`, validación estricta de cuota comercial del plan (3 en Básico, 10 en Pro, 25 en Empresarial), soft-delete defensivo ante registros históricos con dependencias FK, y liberación reactiva e inmediata de cuota sin requerir reinicio del servidor. Suite `test_cu04_branch_quota_release.py` verificada con 6/6 pruebas aprobadas.
5. **`CU05: Gestionar Prendas y Variantes de Precio por Talla` [Modificado 1P - 100%]:**  
   CRUD de prendas en `p2_gestion_productos_catalogo`, persistencia transaccional con `db.commit()`, aislamiento por `tenant_id`, matriz de variantes con precios diferenciados por talla para habilitar políticas de cambio. Suite de pruebas pasando 4/4.
6. **`CU06: Consultar Catálogo Online con Búsqueda Facetada` [Modificado 1P - 100%]:**  
   Tienda online pública con filtros dinámicos multicriterio (categoría, talla, color, rango de precio) indexados en PostgreSQL.
7. **`CU07: Sincronizar y Descargar Catálogo a Almacenamiento Local (PWA / SQLite)` [Nuevo 2P - 100%]:**  
   Endpoint `/api/catalog/offline-pack?branch_id=...`, persistencia IndexedDB nativa en Angular con `IdbCatalogService` (`fashionstore_local_db` v1) y SQLite nativo en Flutter (`local_catalog_db.dart`).
8. **`CU08: Consultar Catálogo Offline en Modo Desconectado` [Nuevo 2P - 100%]:**  
   Detección reactiva de conectividad mediante `NetworkStatusService` con conmutación transparente a caché local ante caídas de red y banner de advertencia de datos locales.
9. **`CU09: Comprar Prendas con Stripe y Despacho Condicionado` [Modificado 1P - 100%]:**  
   Integración con Stripe Elements en Web y Stripe PaymentSheet en Móvil Flutter. Cumplimiento incondicional de la **Política de Negocio 3**: despacho bloqueado si `payment_status != 'paid'`, generación de código de rastreo formal `DSP-YYYYMMDD-XXXX` y stepper ICONIX de 5 etapas.
10. **`CU10: Crear Reserva Online de Prendas con Vencimiento y Bloqueo` [Modificado 1P - 100% Blindado]:**  
    Bloqueo atómico de inventario en `p4_gestion_compras_reservas` (`reserved_quantity`), código amigable `RES-XXXXXXXX`, QR digital, validación de fechas (hoy a +7 días), recordatorio de caducidad a 24h y vista boutique en Angular con tickets de reserva. **Blindado y Automatizado:** Background worker continuo asíncrono en `main.py` (`_expiration_worker_loop`) y endpoint administrativo `POST /api/reservations/sweeper` que auditan reservas vencidas (`expires_at <= today`), liberan de inmediato el stock bloqueado devolviéndolo a disponibilidad general y limpian reservas en carrito abandonado (15 min). Suite `test_cu10_reservation_expiration_sweeper.py` verificada con 4/4 pruebas aprobadas.
11. **`CU11: Registrar Reserva de Prendas Offline en Modo Desconectado (PWA / SQLite)` [Nuevo 2P - 100%]:**  
    Persistencia desconectada con UUIDv4 local (`client_reservation_id`), bandeja Outbox de reservas offline tanto en PWA Web (`IdbReservationsService` en IndexedDB) como en Mobile Flutter (`local_pending_reservations` en SQLite con `LocalCatalogDb`), sincronización reactiva al reconectar con backend `POST /reservations/` garantizando idempotencia transaccional y validación de stock. Suite de pruebas pasando 7/7 en backend y 8/8 en Flutter.
12. **`CU12: Atender y Resolver Conflictos de Reservas Expiradas` [Nuevo 2P - 100%]:**  
    Gestión operativa de discrepancias cuando un cliente asiste tras la expiración del apartado. Backend `p4_gestion_compras_reservas` con endpoints `GET /reservations/branch/conflicts` y `POST /reservations/{id}/resolve-conflict`, validación atómica de inventario físico remanente en percha, reactivación (+24h/48h) con re-bloqueo de `reserved_quantity`, sustitución de prenda/talla disponible o cierre definitivo con nota de auditoría obligatoria. Frontend PWA Angular en `/app/encargado/reservations` con bandeja visual de diagnóstico de percha y modal de resolución adaptativa. Suite `test_cu12_resolve_expired_reservations.py` aprobada 7/7.
13. **`CU13: Registrar Venta POS Desconectada en Efectivo con Contingencia UUIDv4` [Nuevo 2P - 100%]:**  
    Venta de mostrador POS desconectada en `p5_gestion_ventas_pos` con cumplimiento estricto de la **Política de Negocio 5**: cobro en efectivo exclusivo (`cash`), validación de `client_sale_id` UUIDv4 e idempotencia transaccional (reintentos no duplican decremento de inventario). Frontend PWA Angular en `/app/cajero/caja` con bandeja local IndexedDB (`IdbSalesService`), calculadora de cambio en vivo con atajos de efectivo, bloqueo visual de métodos electrónicos en modo desconectado y modal de comprobante térmico con hash UUIDv4 (`TCK-OFF-XXXXXX`). Suite `test_cu13_offline_pos_sales.py` aprobada 5/5.
14. **`CU17: Procesar Cambio de Prenda por Talla con Cobro de Diferencia y Validación de Estado` [Nuevo 2P - 100%]:**  
    Implementación rigurosa de la **Política de Negocio 1 (P-Ten-01)** en `p5_gestion_ventas_pos`. Endpoints `POST /api/exchanges/quote`, `POST /api/exchanges` y `GET /api/exchanges`. Cálculo dinámico de diferencia de precio ($\Delta = P_{\text{nueva}} - P_{\text{original}}$). Si $\Delta > 0$, el cambio se consolida **única y exclusivamente si el cliente abona la diferencia** en caja (`difference_paid = True`); de lo contrario, se rechaza con HTTP 400 y el inventario no se altera. Validación de etiqueta intacta (`good_with_tags`), plazo de cambio (máx. 30 días), actualización física atómica de inventario (+1 vieja, -1 nueva con `with_for_update`) y persistencia en tabla `garment_exchanges`. Suite `test_cu17_garment_exchange.py` con 8/8 pruebas aprobadas (100%).
15. **`CU18: Procesar Devolución de Prenda con Retención Operativa (20%–50%) y Nota de Crédito` [Nuevo 2P - 100%]:**  
    Cumplimiento riguroso de la **Política de Negocio 2 (P-Ten-03)** en `p5_gestion_ventas_pos`. Endpoints `POST /api/returns/quote`, `POST /api/returns` y `GET /api/returns`. Retención operativa configurada por tenant entre el 20% y el 50% (30% en Elegance, 20% en Urbana) y reembolso neto entre el 50% y 80%. Modalidades de liquidación: emisión de Nota de Crédito digital (`NC-YYYYMMDD-XXXX`) o reembolso en efectivo. Validación de prenda intacta con etiqueta adherida (`good_with_tags`) y plazo permitido. Reingreso físico de inventario atómico con bloqueo pesimista `with_for_update`. Frontend Web PWA Angular en `/app/cajero/caja` con cotización previa interactiva y modal de Nota de Crédito. Suite `test_cu18_garment_return.py` con 8/8 pruebas aprobadas (100%) y regresión total de 26/26 pruebas.

---

## 2. Estado por Componente Arquitectónico

### Base de Datos (PostgreSQL 15+ / Alembic Head 0044)
* **Consolidación Definitiva (Migración 0044 Maestro):**
  - Todas las tablas, relaciones, foreign keys e índices para los 25 Casos de Uso están creados y verificados en PostgreSQL (`0044_complete_database_schema_all_use_cases.py`).
  - La base de datos relacional está congelada: no se requieren nuevas migraciones DDL estructurales.
* **Aislamiento Multitenant:** `tenant_id UUID NOT NULL REFERENCES companies(id)` garantizado en todas las entidades de dominio.

### Backend (Python + FastAPI)
* Organizado en 7 paquetes canónicos de arquitectura profunda:
  - `p0_saas_plataforma`: Tenants, suscripciones, cuotas comerciales y auditoría.
  - `p1_gestion_usuarios_acceso`: Usuarios, autenticación JWT, sucursales y proveedores.
  - `p2_gestion_productos_catalogo`: Prendas, variantes de precio por talla, colores y categorías.
  - `p3_gestion_inventario_disponibilidad`: Inventario multisede, pack offline y disponibilidad.
  - `p4_gestion_compras_reservas`: Carrito, órdenes Stripe, despacho y reservas con vencimiento.
  - `p5_gestion_ventas_pos`: Ventas offline con UUIDv4, outbox, batch sync idempotente, cambios y devoluciones.
  - `p6_inteligencia_analitica`: Gemini RAG voz/texto, modelos ML (Supervisado / K-Means) y OpenStreetMap.

### Frontend Web (Angular 21 PWA)
* Desacoplado de servidores externos mediante `runtime-config.js` y detección de localhost en `environment.ts`.
* Almacenamiento local estructurado en IndexedDB (`fashionstore_local_db`).
* Componentes reactivos, Spartan UI, diseño de alta costura (`frontend-design`) y accesibilidad.

### Aplicación Móvil (Flutter / Dart)
* Persistencia local con SQLite embebido (`sqflite`).
* Geolocalización lista para OpenStreetMap (`flutter_map` + OpenRouteService).
* Pasarela Stripe integrada mediante `flutter_stripe`.

---

## 3. Próxima Tarea Inmediata (Presentación 2)
* **`CU11` – Registrar Reserva de Prendas Offline en Modo Desconectado (PWA / SQLite).**
* **`CU13` / `CU14` / `CU15` – Bloque de Ventas Offline en POS (Efectivo, UUIDv4, Outbox y Batch Sync Idempotente).**
