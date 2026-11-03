# 📋 INFORME DE PRUEBAS DE CAJA NEGRA (BLACK-BOX TESTING)
### FashionStore — Plataforma E-Commerce SaaS Multitenant
**Materia:** Sistemas de Información 2 (2do Parcial)  
**Alcance:** Casos de Uso Oficiales de 1ra y 2da Presentación (`CU01` al `CU18`)  
**Metodología:** ICONIX (UML 2.5+) — Verificación Funcional Externa e Integridad Transaccional  
**Estado:** Documento Vivo de Homologación de Calidad  

---

## 1. 🎯 Marco Metodológico y Estándar de Prueba

Las pruebas de caja negra evalúan la funcionalidad del sistema basándose exclusivamente en los requisitos funcionales, contratos de entrada/salida y políticas de negocio inviolables, sin depender de la estructura interna del código fuente.

### Técnicas de Diseño Aplicadas:
1. **Partición de Equivalencia (EP):** División del dominio de datos en clases válidas e inválidas.
2. **Análisis de Valores Límite (BVA):** Verificación de condiciones de frontera (plazos en días, umbrales de stock, montos $\Delta = 0$, cuotas máximas de sucursales).
3. **Pruebas de Transición de Estados:** Cambios en el ciclo de vida de pedidos, reservas, transferencias y ventas (`COMPLETED`, `VENCIDA`, `CANCELLED`).
4. **Verificación de Políticas Inviolables:** Comprobación estricta de las reglas del pliego (abono obligatorio de diferencia $\Delta > 0$, retención 20%-50%, restricción de efectivo offline, cuotas de planes y despacho bloqueado ante pagos no confirmados).

### Estructura Canónica de Cada Caso de Prueba:
| Campo | Definición |
| :--- | :--- |
| **ID Caso de Prueba** | Identificador unívoco formal (`CP-[CU]-[Nro]`). |
| **Caso de Uso** | Código y nombre del Caso de Uso bajo ICONIX. |
| **Tipo de Prueba** | Camino Feliz (*Happy Path*), Límite, Regla de Negocio o Seguridad Multitenant. |
| **Precondiciones** | Estado del sistema, autenticación y datos previos requeridos. |
| **Entradas (Input)** | Parámetros, payloads o acciones del usuario. |
| **Pasos de Ejecución** | Secuencia ordenada de interacción usuario-sistema. |
| **Resultado Esperado** | Comportamiento, código HTTP, mensajes y balance de datos previstos. |
| **Resultado Obtenido** | Comportamiento observado durante la ejecución. |
| **Estado** | `APROBADO` / `PASSED`. |

---

## 2. 🏛️ Matriz de Pruebas de Caja Negra — 1ra Presentación (CU01 al CU10)

---

### CU01: Registrar y Gestionar Empresas (Tenants)

| ID | Objetivo / Escenario | Precondiciones | Datos de Entrada (Input) | Pasos de Ejecución | Resultado Esperado | Resultado Obtenido | Estado |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **CP-CU01-01** | Creación exitosa de empresa tenant (Happy Path) | Superadministrador autenticado con JWT de plataforma. | `name: "Boutique Elegance"`, `business_name: "Boutique Elegance SRL"`, `subdomain: "elegance"`, `nit_rut: "1029384756"`. | 1. Envía `POST /api/saas/companies` con datos válidos.<br>2. Verifica persistencia en base de datos. | Código `HTTP 201 Created`. Registro creado con `status: "ACTIVO"`, UUID generado y aislamiento de esquema preparado. | Empresa creada con UUID unívoco y estado activo. | **APROBADO** |
| **CP-CU01-02** | Rechazo por subdominio o NIT duplicado (Unicidad) | Ya existe una empresa registrada con `subdomain: "elegance"` o NIT `"1029384756"`. | Petición de creación con el mismo subdominio o NIT. | 1. Envía `POST /api/saas/companies` duplicando credencial comercial. | Código `HTTP 409 Conflict` o `400 Bad Request`. Mensaje indicando que el subdominio o NIT ya está en uso. | Rechazo con código 400/409 impidiendo duplicidad. | **APROBADO** |
| **CP-CU01-03** | Listado administrativo de empresas activas | Superadministrador en portal de control global. | Petición `GET /api/saas/companies`. | 1. Ejecuta consulta paginada de tenants. | Código `HTTP 200 OK`. Lista de empresas registradas con sus fechas de alta, estado y suscripción vigente. | Catálogo de tenants retornado con metadatos completos. | **APROBADO** |

---

### CU02: Gestionar Planes de Suscripción (Básico, Pro, Empresarial) y Cuotas

| ID | Objetivo / Escenario | Precondiciones | Datos de Entrada (Input) | Pasos de Ejecución | Resultado Esperado | Resultado Obtenido | Estado |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **CP-CU02-01** | Asignación de plan de suscripción inicial a tenant | Empresa registrada sin suscripción activa. Planes precargados en BD. | `company_id`, `plan_id` (Plan Profesional: máx. 10 sucursales, IA habilitada). | 1. Envía `POST /api/saas/subscriptions`. | Código `HTTP 201 Created`. Suscripción con estado `ACTIVA`, cuota asignada a 10 y auditoría de inicio de vigencia. | Suscripción vinculada exitosamente con cuota de 10 sucursales. | **APROBADO** |
| **CP-CU02-02** | Downgrade Guard: Bloqueo de cambio a plan inferior que exceda cuota activa | Empresa posee 5 sucursales activas en Plan Pro. Intenta descender a Plan Básico (límite: 3). | Solicitud de cambio a plan con `plan_id` de Plan Básico. | 1. Envía `POST /api/saas/subscriptions/change-plan`. | Código `HTTP 400 Bad Request`. Mensaje: *"No puede descender al plan Básico porque tiene 5 sucursales activas (límite: 3)"*. | Cambio de plan rechazado protegiendo la regla Downgrade Guard. | **APROBADO** |
| **CP-CU02-03** | Upgrade de Plan exitoso (Básico a Profesional) | Empresa en Plan Básico con 2 sucursales activas solicita ascenso. | Solicitud de cambio con `plan_id` de Plan Profesional. | 1. Envía solicitud de upgrade de plan. | Código `HTTP 200 OK`. Límite de sucursales ampliado inmediatamente a 10 y acceso a módulo IA activado. | Plan actualizado y cuotas liberadas al instante. | **APROBADO** |

---

### CU03: Iniciar Sesión Multitenant con JWT y Claims de Tenant

| ID | Objetivo / Escenario | Precondiciones | Datos de Entrada (Input) | Pasos de Ejecución | Resultado Esperado | Resultado Obtenido | Estado |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **CP-CU03-01** | Inicio de sesión exitoso con emisión de JWT completo | Usuario activo registrado en la sucursal de un tenant. | `email: "cajero@elegance.com"`, `password: "Correcta123"`. | 1. Envía `POST /api/auth/login`. | Código `HTTP 200 OK`. Retorna `access_token` JWT decodificable con claims: `sub`, `rol`, `tenant_id`, `branch_id`. | Token emitido conteniendo la identidad multitenant completa. | **APROBADO** |
| **CP-CU03-02** | Rechazo por credenciales incorrectas | Usuario registrado en el sistema. | `email: "cajero@elegance.com"`, `password: "Invalida"`. | 1. Envía `POST /api/auth/login` con contraseña errónea. | Código `HTTP 401 Unauthorized`. Mensaje: *"Credenciales inválidas"*. Ningún token generado. | Acceso denegado con HTTP 401. | **APROBADO** |
| **CP-CU03-03** | Rechazo de acceso a usuario desactivado | Usuario marcado en BD con `is_active = False`. | `email: "desactivado@elegance.com"`, credenciales correctas. | 1. Intenta autenticarse en el sistema. | Código `HTTP 403 Forbidden` (o `401`). Mensaje: *"Usuario inactivo"*. | Acceso bloqueado previniendo accesos huérfanos. | **APROBADO** |

---

### CU04: Gestionar Sucursales Bajo Límites del Plan

| ID | Objetivo / Escenario | Precondiciones | Datos de Entrada (Input) | Pasos de Ejecución | Resultado Esperado | Resultado Obtenido | Estado |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **CP-CU04-01** | Creación de sucursal dentro de la cuota del plan | Empresa en Plan Básico con 1 sucursal activa (límite: 3). | `name: "Sucursal Norte"`, `city: "Santa Cruz"`, `address: "Av. Banzer Km 5"`. | 1. Envía `POST /api/branches`. | Código `HTTP 201 Created`. Sucursal creada con `is_active = True`. Cuota pasa de 1 a 2 ocupadas. | Sucursal creada; `/api/branches/quota` reporta 2/3 ocupadas. | **APROBADO** |
| **CP-CU04-02** | Bloqueo al alcanzar el límite comercial del plan (Política 4) | Empresa en Plan Básico con 3 sucursales activas (cuota colmada: 3/3). | Solicitud de creación de una 4ta sucursal. | 1. Envía `POST /api/branches`. | Código `HTTP 403 Forbidden`. Mensaje: *"Límite de sucursales alcanzado para su plan de suscripción (3)"*. | Creación bloqueada; cero sobrecupo permitido. | **APROBADO** |
| **CP-CU04-03** | Liberación inmediata de cuota al desactivar sucursal | Empresa con cuota llena (3/3). Desactiva 1 sucursal existente. | `PATCH /api/branches/{id}/status` con `is_active = False`. | 1. Desactiva sucursal.<br>2. Consulta `GET /api/branches/quota`. | Código `HTTP 200 OK`. Cuota consumida baja inmediatamente a 2/3 sin requerir reinicio del servidor. | Cupo liberado al instante; permite registrar una nueva sucursal. | **APROBADO** |
| **CP-CU04-04** | Soft-Delete defensivo ante dependencias históricas | Sucursal posee registros históricos de inventario y ventas vinculados. | Envía `DELETE /api/branches/{id}`. | 1. Controlador detecta dependencias FK.<br>2. Conmuta operación a soft-delete defensivo. | Código `HTTP 200 OK`. Sucursal marcada con `is_active = False` y desvinculada; FK intactas en PostgreSQL. | Eliminación segura ejecutada sin errores de integridad referencial. | **APROBADO** |

---

### CU05: Gestionar Prendas y Variantes de Precio por Talla

| ID | Objetivo / Escenario | Precondiciones | Datos de Entrada (Input) | Pasos de Ejecución | Resultado Esperado | Resultado Obtenido | Estado |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **CP-CU05-01** | Registro de prenda matriz con variantes diferenciadas por talla | Tenant activo con categoría creada. | Prenda "Vestido Fiesta" con Variante M a Bs 50 y Variante L a Bs 70. | 1. Envía `POST /api/products` con matriz de variantes. | Código `HTTP 201 Created`. Prenda registrada con `ProductVariant` asociadas a distintos precios y SKU único. | Prenda persistida con variantes y precios diferenciales. | **APROBADO** |
| **CP-CU05-02** | Rechazo por SKU duplicado en catálogo de variantes | Ya existe una variante con `sku: "VEST-L-001"`. | Intento de registrar otra variante con el mismo SKU. | 1. Envía solicitud con SKU existente. | Código `HTTP 400 Bad Request` o `409 Conflict`. Restricción de unicidad aplicada. | Error de SKU duplicado capturado en controlador. | **APROBADO** |
| **CP-CU05-03** | Aislamiento de catálogo entre tenants | Empresa A tiene prenda con ID X. Usuario de Empresa B intenta editarla. | Petición `PUT /api/products/{id_X}` con token de Empresa B. | 1. Backend evalúa `tenant_id`. | Código `HTTP 404 Not Found` (o `403 Forbidden`). Producto inaccesible para otro tenant. | Aislamiento multitenant blindado; catálogo privado. | **APROBADO** |

---

### CU06: Consultar Catálogo Online con Búsqueda Facetada

| ID | Objetivo / Escenario | Precondiciones | Datos de Entrada (Input) | Pasos de Ejecución | Resultado Esperado | Resultado Obtenido | Estado |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **CP-CU06-01** | Búsqueda facetada multicriterio (Categoría, Talla, Rango de Precio) | Catálogo con 50 prendas publicadas indexadas en PostgreSQL. | `GET /api/catalog/products?category=vestidos&size=M&min_price=40&max_price=80`. | 1. Usuario aplica filtros dinámicos en tienda online. | Código `HTTP 200 OK`. Retorna únicamente prendas que cumplan simultáneamente todos los criterios. | Resultados facetados exactos con paginación optimizada. | **APROBADO** |
| **CP-CU06-02** | Búsqueda facetada sin resultados coincidentes | Ninguna prenda cumple los filtros extremos especificados. | Filtro con `min_price=5000` en categoría económica. | 1. Ejecuta búsqueda con filtros fuera de rango. | Código `HTTP 200 OK`. Retorna lista vacía `data: []` y total 0 sin errores en el servidor. | Respuesta vacía controlada; mensaje en frontend: *"Sin coincidencias"*. | **APROBADO** |

---

### CU07: Sincronizar y Descargar Catálogo a Almacenamiento Local (PWA / SQLite)

| ID | Objetivo / Escenario | Precondiciones | Datos de Entrada (Input) | Pasos de Ejecución | Resultado Esperado | Resultado Obtenido | Estado |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **CP-CU07-01** | Descarga exitosa de paquete comprimido de catálogo offline | Servidor con prendas e inventario de sucursal. Conectividad estable. | Petición `GET /api/catalog/offline-pack?branch_id={id}`. | 1. Cliente PWA/Móvil solicita el paquete de la sucursal. | Código `HTTP 200 OK`. JSON estructurado con productos, variantes, precios, fotos y stock local. | Paquete descargado con éxito con versión de sincronización. | **APROBADO** |
| **CP-CU07-02** | Persistencia completa en IndexedDB (`fashionstore_local_db`) | PWA en navegador compatible con IndexedDB v1. | Paquete offline recibido de 30 productos. | 1. `IdbCatalogService` almacena registros en almacén de objetos local. | Catálogo guardado en disco del navegador; disponible para consultas offline. | Almacenes `products` e `inventory` poblados en IndexedDB. | **APROBADO** |
| **CP-CU07-03** | Persistencia completa en SQLite en App Móvil Flutter | App móvil con motor `sqflite` inicializado. | Paquete offline descargado mediante Dio. | 1. `LocalCatalogDb` ejecuta inserciones en lote dentro de transacción SQLite. | Tabla `local_products` poblada localmente en el almacenamiento del dispositivo. | Base de datos SQLite local lista para ventas desconectadas. | **APROBADO** |

---

### CU08: Consultar Catálogo Offline en Modo Desconectado

| ID | Objetivo / Escenario | Precondiciones | Datos de Entrada (Input) | Pasos de Ejecución | Resultado Esperado | Resultado Obtenido | Estado |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **CP-CU08-01** | Conmutación reactiva y consulta en caché local ante corte de internet | Dispositivo pierde conectividad (`navigator.onLine = false`). Catálogo local precargado. | Usuario escribe "vestido" en el buscador de la tienda. | 1. `NetworkStatusService` detecta estado desconectado.<br>2. Consulta conmuta a IndexedDB/SQLite. | Despliegue de resultados desde almacenamiento local con banner ámbar: *"Modo Sin Conexión"*. | Búsqueda exitosa local sin lanzar errores de red. | **APROBADO** |
| **CP-CU08-02** | Filtrado local por categorías sin conexión | Dispositivo sin internet. | Clic en categoría "Pantalones" en menú local. | 1. Ejecuta query local sobre almacén IndexedDB/SQLite. | Despliega los productos descargados correspondientes a esa categoría. | Filtro local operativo con respuesta instantánea (< 50ms). | **APROBADO** |

---

### CU09: Comprar Prendas con Stripe y Despacho Condicionado

| ID | Objetivo / Escenario | Precondiciones | Datos de Entrada (Input) | Pasos de Ejecución | Resultado Esperado | Resultado Obtenido | Estado |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **CP-CU09-01** | Pago exitoso con Stripe y emisión de despacho (Política 3) | Carrito con prendas. Pasarela Stripe configurada. Tarjeta de prueba válida. | Confirmación de pago con PaymentIntent confirmado (`status: "succeeded"`). | 1. Stripe confirma `payment_status = "paid"`.<br>2. Controlador genera orden de despacho. | Código `HTTP 200 OK`. Orden pasa a `PAGADA`, se emite código de rastreo formal `DSP-YYYYMMDD-XXXX`. | Despacho generado exitosamente cumpliendo la Política 3. | **APROBADO** |
| **CP-CU09-02** | Bloqueo absoluto de despacho ante pago rechazado o pendiente | Tarjeta de crédito rechazada por fondos insuficientes o pago en espera. | Stripe retorna `status: "requires_payment_method"` o `pending`. | 1. Controlador evalúa `payment_status`.<br>2. No detecta estado `"paid"`. | Bloqueo de orden de despacho. Estado de orden permanece en `PENDIENTE_PAGO`; cero stock despachado. | Despacho bloqueado protegiendo la mercadería física. | **APROBADO** |

---

### CU10: Crear Reserva Online de Prendas con Vencimiento y Bloqueo

| ID | Objetivo / Escenario | Precondiciones | Datos de Entrada (Input) | Pasos de Ejecución | Resultado Esperado | Resultado Obtenido | Estado |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **CP-CU10-01** | Creación de reserva activa con bloqueo atómico de stock | Prenda con stock disponible en tienda (`quantity = 10`, `reserved = 0`). | Prenda seleccionada, cantidad 1, fecha de retiro dentro de 48h. | 1. Cliente envía `POST /api/reservations`. | Código `HTTP 201 Created`. Stock comprometido sube (`reserved_quantity = 1`), código `RES-XXXXXXXX` y QR emitido. | Reserva creada; stock disponible baja inmediatamente a 9. | **APROBADO** |
| **CP-CU10-02** | Barrido automático de reserva vencida con liberación de stock | Reserva alcanzó `expires_at <= now()`. Stock comprometido = 1. | Ejecución del sweeper continuo (`_expiration_worker_loop` / `POST /api/reservations/sweeper`). | 1. Sweeper audita reservas caducadas.<br>2. Actualiza estado a `VENCIDA`.<br>3. Resta `reserved_quantity`. | Reserva pasa a `VENCIDA`. El stock comprometido se decrementa a 0 y el stock disponible general se restablece. | Stock desbloqueado automáticamente y devuelto a disponibilidad general. | **APROBADO** |
| **CP-CU10-03** | Rechazo por fecha de retiro fuera del plazo legal | Cliente intenta fijar retiro a 15 días (plazo máximo permitido: 7 días). | `pickup_date` fuera de rango. | 1. Envía solicitud de reserva con fecha excesiva. | Código `HTTP 400 Bad Request`. Mensaje: *"La fecha de retiro debe estar entre hoy y 7 días máximo"*. | Rechazo controlado; reserva no creada. | **APROBADO** |

---

## 3. 📦 Matriz de Pruebas de Caja Negra — 2da Presentación (CU11 al CU18)

---

### CU11: Registrar Reserva de Prendas Offline en Modo Desconectado (PWA / SQLite)

| ID | Objetivo / Escenario | Precondiciones | Datos de Entrada (Input) | Pasos de Ejecución | Resultado Esperado | Resultado Obtenido | Estado |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **CP-CU11-01** | Generación de reserva local sin internet en PWA | Red desconectada (`navigator.onLine = false`). Catálogo local precargado en IndexedDB con variante `var_id: "a1b2c3d4-..."` (Stock local: 5). | `client_reservation_id: "c8e14b2d-9876-4321-bb11-8899aabbccdd"`, `visit_date: "2026-11-05"`, `pickup_date: "2026-11-07"`, `items: [{"variant_id": "a1b2c3d4-...", "quantity": 1}]`. | 1. Cliente selecciona prenda y fecha de retiro en modo offline.<br>2. PWA valida stock en caché local.<br>3. `IdbReservationsService` persiste en IndexedDB (`pending_reservations`). | Guardado en IndexedDB con estado `PENDIENTE_SYNC`, decremento local de stock (5 a 4) y ticket de contingencia `RES-OFF-AABB11` generado. | Reserva en cola outbox con UUIDv4; ticket modal desplegado con código provisorio. | **APROBADO** |
| **CP-CU11-02** | Registro offline en App Móvil Flutter con SQLite | App Móvil en modo desconectado. Base SQLite `fashionstore_mobile.db` activa. | `client_reservation_id: "d9f25c3e-1111-2222-3333-444455556666"`, `branch_id: "b1000000-0000-0000-0000-000000000001"`, `items: [{"variant_id": "var_001", "quantity": 1}]`. | 1. Usuario confirma reserva en Flutter.<br>2. `LocalCatalogDb` ejecuta `INSERT INTO local_pending_reservations`. | Registro insertado en SQLite con `sync_status = 'PENDIENTE_SYNC'`, QR generado en pantalla y stock local reducido. | Operación almacenada en tabla SQLite nativa del dispositivo. | **APROBADO** |
| **CP-CU11-03** | Sincronización idempotente automática al reconectar | Conexión restablecida (`window:online`). 1 reserva en outbox (`client_reservation_id: "c8e14b2d-..."`). | Evento reactivo `online` envía `POST /api/reservations/` con payload de contingencia y `client_reservation_id`. | 1. Outbox worker detecta red.<br>2. Envía petición HTTP al backend.<br>3. Backend valida idempotencia y ejecuta `with_for_update` en `Inventory`. | Código `HTTP 201 Created`. Stock central bloqueado (`reserved_quantity += 1`), código definitivo `RES-20261102-0042` emitido y outbox local pasa a `CONFIRMADO_SERVER`. | Reserva consolidada en PostgreSQL; badge de PWA conmuta de ámbar a verde confirmado. | **APROBADO** |
| **CP-CU11-04** | Prevención de doble sincronización por reintento de red (Idempotencia) | Red intermitente reenvía el mismo `client_reservation_id: "c8e14b2d-..."` 100 ms después de la primera petición. | Mismo payload con `client_reservation_id: "c8e14b2d-..."` enviado en dos peticiones concurrentes. | 1. Backend recibe primera petición y persiste.<br>2. Segunda petición detecta `client_reservation_id` preexistente en el tenant. | Código `HTTP 200/201`. Retorna la reserva existente sin duplicar filas en `reservations` ni volver a incrementar `reserved_quantity`. | Idempotencia verificada: 1 sola reserva y 1 solo incremento en inventario. | **APROBADO** |

---

### CU12: Atender y Resolver Conflictos de Reservas Expiradas

| ID | Objetivo / Escenario | Precondiciones | Datos de Entrada (Input) | Pasos de Ejecución | Resultado Esperado | Resultado Obtenido | Estado |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **CP-CU12-01** | Visualización en panel de reservas vencidas con diagnóstico de percha | Reserva `res_id: "res-exp-001"` con `status = 'expired'` tras barrido del sweeper. Encargado autenticado en sucursal `branch_id: "b1000000-..."`. | Petición `GET /api/reservations/branch/conflicts?branch_id=b1000000-...`. | 1. Encargado abre pestaña "Bandeja de Conflictos".<br>2. Backend consulta reservas vencidas y audita stock actual en percha (`quantity - reserved_quantity`). | Código `HTTP 200 OK`. Retorna array con reserva, prenda, talla, días de atraso y bandera `can_reactivate: true` (stock percha >= 1). | Bandeja cargada con semáforo verde indicando disponibilidad física en percha. | **APROBADO** |
| **CP-CU12-02** | Resolución vía Reactivación con stock disponible | Reserva expirada `res_id: "res-exp-001"`. Prenda con existencias en tienda (`quantity: 5, reserved: 0`). | `POST /api/reservations/res-exp-001/resolve-conflict` con `resolution_type: "reactivate"`, `extension_days: 2`, `resolution_note: "Cliente justificó demora por fuerza mayor"`. | 1. Encargado selecciona 'Reactivar'.<br>2. Backend ejecuta `with_for_update` en `Inventory`.<br>3. Extiende `expires_at` en +48h y re-bloquea `reserved_quantity` (+1). | Código `HTTP 200 OK`. `status: "confirmed"`, `reserved_quantity: 1`, auditoría `[REACTIVACIÓN +2d]` guardada en `resolution_note`. | Reserva reactivada con éxito; stock bloqueado atómicamente en percha. | **APROBADO** |
| **CP-CU12-03** | Bloqueo de reactivación si la prenda fue vendida a otro cliente | Prenda de reserva expirada tiene stock disponible = 0 (`quantity: 1, reserved: 1` de otra orden). | `POST /api/reservations/res-exp-002/resolve-conflict` con `resolution_type: "reactivate"`, `extension_days: 1`. | 1. Encargado intenta forzar reactivación.<br>2. Backend audita `quantity - reserved_quantity < requested`. | Código `HTTP 400 Bad Request`. Mensaje: *"No hay existencias suficientes en percha para reactivar la reserva"*. Inventario intacto. | Reactivación denegada con HTTP 400 protegiendo contra sobreventa física. | **APROBADO** |
| **CP-CU12-04** | Resolución vía Sustitución de Variante | Prenda original (Vestido Talla M) agotada. Talla L (`new_var_id: "var-vest-L"`) tiene 3 unidades disponibles. | `POST /api/reservations/res-exp-003/resolve-conflict` con `resolution_type: "substitute"`, `new_variant_id: "var-vest-L"`, `resolution_note: "Sustituido por Talla L con consentimiento"`. | 1. Encargado selecciona prenda sustituta.<br>2. Backend actualiza `ReservationItem.variant_id`.<br>3. Bloquea stock de Talla L (`reserved_quantity += 1`). | Código `HTTP 200 OK`. `status: "confirmed"`, variante actualizada en el ticket y auditoría `[SUSTITUCIÓN VAR SKU]` registrada. | Variante reasignada exitosamente sin descuadres contables de inventario. | **APROBADO** |
| **CP-CU12-05** | Cierre definitivo y desistimiento | Cliente desiste de la compra tras asistir fuera de plazo. | `POST /api/reservations/res-exp-004/resolve-conflict` con `resolution_type: "close"`, `resolution_note: "Cliente desiste formalmente de retirar la prenda"`. | 1. Encargado marca cierre definitivo.<br>2. Backend valida nota >= 5 caracteres y actualiza estado. | Código `HTTP 200 OK`. `status: "cancelled"`, `resolved_at: now()`, stock remanente liberado permanentemente. | Reserva cerrada y archivada en auditoría; percha disponible para venta general. | **APROBADO** |

---

### CU13: Registrar Venta POS Desconectada en Efectivo con Contingencia UUIDv4

| ID | Objetivo / Escenario | Precondiciones | Datos de Entrada (Input) | Pasos de Ejecución | Resultado Esperado | Resultado Obtenido | Estado |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **CP-CU13-01** | Venta offline exitosa exclusivamente en efectivo (Política 5) | Caja POS sin conexión a internet. Prenda "Vestido Fiesta L" en catálogo local (Bs 70.00, saldo: 5). | `client_sale_id: "a3b9f123-5555-4444-9999-112233445566"`, `is_offline: true`, `payment_method: "cash"`, `cash_received: 100.00`, `items: [{"variant_id: "var-vest-L", quantity: 1, unit_price: 70.00}]`. | 1. Cajero registra venta en modo desconectado.<br>2. PWA calcula cambio: Bs 30.00.<br>3. `IdbSalesService` persiste en IndexedDB (`pending_offline_sales`).<br>4. Emite ticket térmico modal. | Venta guardada en IndexedDB con estado `PENDIENTE_SYNC`, stock local descontado (5 a 4), ticket térmico `TCK-OFF-334455` emitido con hash UUIDv4. | Venta de contingencia creada; cambio en vivo calculado a Bs 30.00 y modal de ticket presentado. | **APROBADO** |
| **CP-CU13-02** | Bloqueo estricto de pagos electrónicos en modo offline (Política 5 Inviolable) | TPV sin conectividad a internet. Carrito con prendas por Bs 140.00. | Intento de registrar venta offline con `payment_method: "stripe"` o `"tarjeta"`. | 1. Cajero intenta seleccionar método digital.<br>2. Interfaz bloquea visualmente botones de tarjeta.<br>3. Pydantic `@field_validator('payment_method')` evalúa `is_offline = True`. | PWA deshabilita métodos digitales. A nivel API/Schema se genera `HTTP 422 Unprocessable Entity`: *"Las ventas offline deben pagarse exclusivamente en efectivo (cash)"*. | Bloqueo absoluto de pagos electrónicos garantizando la Política 5. | **APROBADO** |
| **CP-CU13-03** | Idempotencia transaccional central: Reintento de sincronización sin doble descuento | Venta offline previamente sincronizada en backend con `client_sale_id: "a3b9f123-..."`. Stock de prenda en BD: 8 unidades. | Segundo envío HTTP a `create_sale` con el mismo `client_sale_id: "a3b9f123-..."` y mismo `tenant_id`. | 1. PWA o sync worker reenvía venta por fallo de confirmación de red.<br>2. `sales_service.py` detecta `client_sale_id` existente. | Retorna la venta existente `Sale` con `HTTP 200/201`. Cero ejecuciones de descuento de stock. El inventario central permanece intacto en 8 unidades. | Idempotencia confirmada: no se genera venta duplicada ni se descuenta inventario por segunda vez. | **APROBADO** |
| **CP-CU13-04** | Aislamiento Multitenant en ventas offline | Venta offline generada con `client_sale_id` en Boutique Elegance. Token JWT de Moda Urbana intenta sincronizarla. | Petición de sincronización con `client_sale_id` foráneo bajo token de otro tenant. | 1. `sales_service` consulta `client_sale_id` filtrando por `tenant_id` de la empresa del token. | Backend procesa la venta exclusivamente dentro del contexto de Moda Urbana sin afectar registros de Elegance. | Aislamiento estricto por `tenant_id` verificado; cero colisión cruzada entre tenants. | **APROBADO** |
| **CP-CU13-05** | Validación de identificador único de contingencia (`client_sale_id`) obligatorio | Petición con `is_offline = true` enviada sin `client_sale_id` (o `null`). | Payload con `is_offline: true, client_sale_id: null`. | 1. Cliente envía venta desconectada sin UUID.<br>2. `sales_service.py` valida presencia obligatoria de UUID de cliente. | Código `HTTP 400 Bad Request`. Mensaje: *"Las ventas offline requieren client_sale_id para idempotencia"*. | Rechazo HTTP 400 impidiendo inserción de ventas huérfanas sin trazabilidad. | **APROBADO** |

---

### CU14: Gestionar Bandeja Local de Operaciones Pendientes (Outbox PWA / SQLite)

**Ficha Técnica de Cobertura:**
- **Entidades Auditadas:** Bandeja Local IndexedDB (`pending_offline_sales`), Servicio API `POST /api/sales/offline/check-status`, y `sales`.
- **Política Clave:** Autonomía operativa desconectada y trazabilidad universal mediante `client_sale_id` (UUIDv4) con arqueo contable de efectivo en gaveta física.

| ID | Objetivo / Escenario | Precondiciones | Datos de Entrada (Input) | Pasos de Ejecución | Resultado Esperado | Resultado Obtenido | Estado |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **CP-CU14-01** | **Acumulación y Persistencia de Transacciones en Bandeja Outbox (IndexedDB)** | TPV en modo contingencia offline (`simulatedOffline = true` o sin internet). Catálogo local cargado. | Venta 1: Vestido L (Bs 70.00). Venta 2: Pantalón M (Bs 50.00). Ambos cobrados en efectivo. | 1. Cajero emite venta 1 (Ticket `TCK-OFF-8A2F1B`).<br>2. Cajero emite venta 2 (Ticket `TCK-OFF-3C4D5E`).<br>3. Cajero hace clic en pestaña *"Bandeja Outbox Local"* (`switchTab('outbox')`). | La bandeja despliega 2 comprobantes con estado *"Pendiente Outbox"* (badge ámbar), montos Bs 70.00 y Bs 50.00, y UUIDv4 únicos asignados. Arqueo refleja Bs 120.00. | Bandeja renderiza ambas ventas con identificadores UUIDv4 y arqueo en Bs 120.00 en gaveta. | **APROBADO** |
| **CP-CU14-02** | **Verificación de Estado contra Servidor Central (`check-status`)** | Servidor online restablecido. Bandeja contiene 2 ventas: UUID-A (ya registrada en backend previamente) y UUID-B (pendiente real). | `client_sale_ids: ["9e3c988a-3e81-42cb-b1b7-ff0b8a2e55aa", "a1b2c3d4-e5f6-47a8-b9c0-112233445566"]`. | 1. Cajero presiona botón *"Verificar con Servidor"* en la bandeja.<br>2. PWA envía `POST /api/sales/offline/check-status`.<br>3. `sales_service.py` valida estado de cada UUID en BD.<br>4. PWA actualiza marcas locales de sincronización. | Código `HTTP 200 OK`. `status_map: {UUID-A: "synced", UUID-B: "pending"}`. En UI, UUID-A cambia automáticamente a *"Sincronizado"* (badge esmeralda). | Estado de sincronización conciliado contra el servidor central sin alterar ventas. | **APROBADO** |
| **CP-CU14-03** | **Sincronización Individual desde Bandeja con Transición de Estado** | Conexión restablecida. Comprobante `TCK-OFF-3C4D5E` pendiente en outbox. Stock suficiente en inventario central. | Clic en botón acción *"Sincronizar Venta Ahora"* de la fila correspondiente. | 1. PWA invoca `syncSingleSale()`.<br>2. Envía `POST /api/sales` con `client_sale_id` del ticket.<br>3. Backend registra venta e inventario.<br>4. `IdbSalesService.markAsSynced()` actualiza IndexedDB. | Fila del ticket pasa a *"Sincronizado"* con icono check verde. Toast informa: *"Ticket TCK-OFF-3C4D5E sincronizado exitosamente con el servidor"*. Contador de pendientes decrementa. | Venta sincronizada unitariamente; estado actualizado en IndexedDB y UI. | **APROBADO** |
| **CP-CU14-04** | **Arqueo en Vivo de Gaveta Offline y Purga de Ventas Consolidadas** | 1 venta pendiente por Bs 50.00 y 1 venta sincronizada por Bs 70.00 en bandeja. | Clic en botón *"Purgar Sincronizadas"* (`clearSyncedFromOutbox()`). | 1. PWA calcula métrica `totalPendingCash()` = Bs 50.00.<br>2. Cajero presiona *"Purgar Sincronizadas"*.<br>3. `IdbSalesService.clearSynced()` elimina registros con `synced = true`. | Solo permanece la venta pendiente en la tabla. Métrica de efectivo en gaveta se mantiene intacta en Bs 50.00. Comprobantes sincronizados se depuran de memoria local. | Purga ejecutada; solo se conservan pendientes y el arqueo de efectivo se preserva. | **APROBADO** |

---

### CU15: Sincronizar Lotes de Ventas con Idempotencia Central (`sync_operations`)

| ID | Objetivo / Escenario | Precondiciones | Datos de Entrada (Input) | Resultado Esperado | Resultado Obtenido | Estado |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **CP-CU15-01** | Sincronización masiva de lote de ventas offline exitosa | Servidor online. Bandeja outbox contiene 5 ventas offline válidas. | Envío de array JSON a `POST /api/sales/offline/batch-sync`. | Backend persiste las 5 ventas en `sales`, registra cada UUID en `sync_operations`, descuenta stock central y retorna confirmación. | Lote sincronizado al 100%; outbox local se vacía y ventas quedan consolidadas. | **APROBADO** |
| **CP-CU15-02** | Garantía de Idempotencia ante reintentos de red duplicados | Caída de red durante la respuesta obliga al cliente a reenviar el mismo lote. | Envío repetido del lote con los mismos `client_sale_id`. | Backend consulta `sync_operations`, reconoce las operaciones ya procesadas y confirma con HTTP 200 sin duplicar ventas ni stock. | Cero duplicación de ventas y cero descuentos dobles de existencias. | **APROBADO** |
| **CP-CU15-03** | Rechazo de ventas pertenecientes a otro tenant | Lote alterado maliciosamente con `tenant_id` diferente al token JWT del cajero. | Payload con `tenant_id` foráneo. | Código `HTTP 403 Forbidden` o `400 Bad Request`. La transacción ajena se descarta. | Aislamiento multitenant protegido; transacciones sospechosas rechazadas. | **APROBADO** |

---

### CU16: Gestionar y Resolver Conflictos de Ventas Offline y Quiebres de Stock

| ID | Objetivo / Escenario | Precondiciones | Datos de Entrada (Input) | Resultado Esperado | Resultado Obtenido | Estado |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **CP-CU16-01** | Detección de sobreventa offline por quiebre de stock central | Se vendió offline 1 unidad que simultáneamente se vendió online (stock central = 0). | Sincronización del lote con stock central insuficiente. | Venta se registra con estado `EN_CONFLICTO`, se emite notificación de alta prioridad al Encargado. | Venta clasificada en conflicto sin provocar error fatal en la sincronización. | **APROBADO** |
| **CP-CU16-02** | Resolución de Conflicto 1: Autorización con stock negativo | Prenda física ya fue entregada al cliente offline. Sucursal recibirá reposición pronto. | Encargado selecciona *"Autorizar con stock negativo y reposición"*. | Inventario central queda en `-1`, venta pasa a `COMPLETED` y se genera orden interna de reposición. | Conflicto cerrado con auditoría contable; stock ajustado a `-1`. | **APROBADO** |
| **CP-CU16-03** | Resolución de Conflicto 2: Sustitución de prenda acordada | Cliente contactado telefónicamente acepta cambio por modelo análogo. | Encargado selecciona *"Sustituir por Variante Alternativa"*, indicando el nuevo SKU. | Se descuenta 1 unidad de la variante sustituta, se cancela el reclamo y se actualiza el ticket. | Conciliación de inventario completada de común acuerdo con el cliente. | **APROBADO** |
| **CP-CU16-04** | Resolución de Conflicto 3: Emisión de Nota de Crédito / Reembolso | Cliente solicita devolución del dinero tras detectarse la falta de stock. | Encargado selecciona *"Anular venta y emitir Nota de Crédito"*. | Venta marcada como `ANULADA_POR_QUIEBRE`, generación de código `NC-YYYYMMDD-XXXX`. | Operación anulada contablemente y comprobante de reembolso emitido. | **APROBADO** |

---

### CU17: Procesar Cambio de Prenda por Talla con Cobro de Diferencia y Estado

**Ficha Técnica de Cobertura:**
- **Entidad Auditada:** `garment_exchanges` y balances de `inventory`.
- **Política Clave (P-Ten-01):** Si $\Delta = P_{\text{nueva}} - P_{\text{original}} > 0$, el cambio **solo** se consolida si el cliente abona la diferencia (`difference_paid = True`).
- **Condición de Prenda:** Etiqueta textil obligatoria e intacta (`good_with_tags`).

| ID | Objetivo / Escenario | Precondiciones | Datos de Entrada (Input) | Pasos de Ejecución | Resultado Esperado | Resultado Obtenido | Estado |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **CP-CU17-01** | **Cotización de Cambio con Mayor Precio ($\Delta > 0$)** | Venta previa con Vestido M (Bs 50). Vestido L cuesta Bs 70 y tiene 5 unidades en stock. | `sale_id`, `var_orig_id` (Talla M), `var_higher_id` (Talla L). | 1. Cajero ingresa a cotizador.<br>2. Envía `POST /api/exchanges/quote`. | Código `HTTP 200 OK`. `price_difference: 20.00`, `requires_payment: true`, `available_stock_new: 5`. | Respuesta 200 OK con desglose exacto de Bs 20.00 y bandera de pago requerida en `true`. | **APROBADO** |
| **CP-CU17-02** | **Cotización de Cambio al Mismo Precio ($\Delta = 0$)** | Venta con Vestido M (Bs 50). Vestido S cuesta Bs 50 y tiene 3 unidades en stock. | `sale_id`, `var_orig_id` (Talla M), `var_same_id` (Talla S). | 1. Cajero selecciona variante del mismo precio.<br>2. Envía `POST /api/exchanges/quote`. | Código `HTTP 200 OK`. `price_difference: 0.00`, `requires_payment: false`. | Respuesta 200 OK, diferencia Bs 0.00 y no requiere cobro. | **APROBADO** |
| **CP-CU17-03** | **Rechazo por Falta de Pago de Diferencia (Política 1 Inviolable)** | Venta con prenda Bs 50. Prenda nueva Bs 70 ($\Delta = \text{Bs } 20$). Cliente rehúsa o no abona el monto. | `difference_paid: false`, `condition: "good_with_tags"`. | 1. Cajero intenta consolidar el cambio sin confirmar cobro.<br>2. Envía `POST /api/exchanges`. | Código `HTTP 400 Bad Request`. Mensaje: *"La nueva prenda tiene mayor precio... solo puede consolidarse si abona la diferencia"*. Stock intacto (M=10, L=5). | Rechazo HTTP 400. La transacción se cancela; las existencias de M y L quedan inalteradas. | **APROBADO** |
| **CP-CU17-04** | **Consolidación Exitosa con Pago de Diferencia ($\Delta > 0$)** | Prenda original Bs 50 (Stock=10). Prenda nueva Bs 70 (Stock=5). Cliente paga Bs 20 en efectivo. | `difference_paid: true`, `payment_method: "efectivo"`, `condition: "good_with_tags"`. | 1. Cajero marca diferencia abonada.<br>2. Envía `POST /api/exchanges`. | Código `HTTP 201 Created`. Registro en `garment_exchanges` (`COMPLETED`). Stock M sube a 11 (+1) y Stock L baja a 4 (-1). | Registro creado con éxito. Stock de talla M reingresado a 11 y talla L egresado a 4. | **APROBADO** |
| **CP-CU17-05** | **Consolidación de Cambio sin Cobro para Igual Precio ($\Delta = 0$)** | Prenda original Bs 50 (Stock=10). Prenda nueva Bs 50 (Stock=3). | `difference_paid: false`, `condition: "good_with_tags"`. | 1. Cajero procesa cambio de talla M a S sin ingresar cobro.<br>2. Envía `POST /api/exchanges`. | Código `HTTP 201 Created`. Operación aprobada. Stock S disminuye a 2 (-1). | Cambio procesado exitosamente sin exigir pago. Stock de S actualizado a 2. | **APROBADO** |
| **CP-CU17-06** | **Rechazo por Prenda Dañada o Sin Etiqueta Textil** | Cliente presenta prenda con etiqueta arrancada o signos de uso evidente. | `condition: "damaged_or_no_tags"`, `difference_paid: true`. | 1. Cajero inspecciona prenda e indica estado no conforme.<br>2. Envía `POST /api/exchanges`. | Código `HTTP 400 Bad Request`. Mensaje: *"La prenda debe contar con su etiqueta textil intacta"*. No altera stock. | Rechazo HTTP 400. Operación cancelada sin movimientos de inventario. | **APROBADO** |
| **CP-CU17-07** | **Bloqueo por Quiebre de Stock de la Variante Nueva** | Prenda nueva deseada tiene 0 unidades disponibles en inventario físico. | `new_variant_id` con stock disponible = 0. | 1. Cajero intenta solicitar cambio por talla agotada.<br>2. Envía `POST /api/exchanges`. | Código `HTTP 400 Bad Request`. Mensaje: *"No hay existencias disponibles de la nueva variante"*. | Rechazo HTTP 400 informando agotamiento de stock en la sucursal. | **APROBADO** |
| **CP-CU17-08** | **Aislamiento Multitenant Estricto** | Cajero de Empresa B intenta procesar un cambio sobre ticket de Empresa A. | Token JWT con `tenant_id` de Boutique B y `sale_id` de Boutique A. | 1. Petición autenticada intenta procesar venta ajena.<br>2. Envía `POST /api/exchanges`. | Código `HTTP 404 Not Found` (o `403 Forbidden`). Cero filtración entre boutiques. | Retorna HTTP 404 indicando que la venta original no existe en el tenant. | **APROBADO** |

---

### CU18: Procesar Devolución de Prenda con Retención Operativa (20%-50%) y Nota de Crédito

**Ficha Técnica de Cobertura:**
- **Entidades Auditadas:** `garment_returns`, `inventory`, `sales`, `companies`.
- **Política Clave (P-Ten-03):** Retención operativa fija o configurable por tenant en el rango acotado $[20\%, 50\%]$ (Boutique Elegance: 30%, Moda Urbana: 20%). Reembolso neto al cliente del $50\%$ al $80\%$.
- **Condición de Prenda Inviolable:** Prenda intacta con etiqueta textil original adherida (`good_with_tags`).

| ID | Objetivo / Escenario | Precondiciones | Datos de Entrada (Input) | Pasos de Ejecución | Resultado Esperado | Resultado Obtenido | Estado |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **CP-CU18-01** | **Cotización de retención al 30% en Boutique Elegance** | Venta de Vestido Fiesta L por Bs 100.00 en Boutique Elegance (política: $R=30\%$, máx. 7 días). Compra realizada dentro del plazo. | `sale_id`, `variant_id` devuelta. | 1. Cajero ingresa ticket.<br>2. Envía `POST /api/returns/quote`.<br>3. `return_service` evalúa política del tenant. | Código `HTTP 200 OK`. `original_price: 100.00`, `retention_rate: 0.30`, `retention_amount: 30.00`, `refund_amount: 70.00`, `is_within_period: true`. | Respuesta 200 OK con desglose exacto: retención Bs 30.00 y reembolso neto Bs 70.00. | **APROBADO** |
| **CP-CU18-02** | **Cotización de retención al 20% en Moda Urbana** | Venta de Pantalón Jeans por Bs 200.00 en Moda Urbana (política: $R=20\%$, máx. 15 días). | `sale_id`, `variant_id` devuelta. | 1. Cajero ingresa ticket en Moda Urbana.<br>2. Envía `POST /api/returns/quote`. | Código `HTTP 200 OK`. `original_price: 200.00`, `retention_rate: 0.20`, `retention_amount: 40.00`, `refund_amount: 160.00`. | Respuesta 200 OK con retención del 20% (Bs 40.00) y reembolso neto de Bs 160.00. | **APROBADO** |
| **CP-CU18-03** | **Devolución consolidada con emisión de Nota de Crédito Digital** | Venta previa de Bs 100.00. Cliente acepta saldo a favor para compras futuras. Prenda en estado `good_with_tags`. Stock en BD: 5 unidades. | `sale_id`, `variant_id`, `condition: "good_with_tags"`, `refund_method: "NOTA_CREDITO"`, `reason: "Talla inadecuada"`. | 1. Cajero selecciona modalidad Nota de Crédito.<br>2. Envía `POST /api/returns`.<br>3. Backend ejecuta `with_for_update` en `Inventory`.<br>4. Genera código único `NC-YYYYMMDD-XXXX`. | Código `HTTP 201 Created`. Registro en `garment_returns`, stock incrementado a 6 (+1), código de nota generado. | Registro creado, código `NC-20261102-XXXX` emitido y stock reingresado a 6. | **APROBADO** |
| **CP-CU18-04** | **Devolución consolidada con reembolso en Efectivo en mostrador** | Venta de Bs 200.00 en Moda Urbana. Cliente solicita reembolso en efectivo. Stock en BD: 2 unidades. | `sale_id`, `variant_id`, `condition: "good_with_tags"`, `refund_method: "EFECTIVO"`, `reason: "Disconformidad de color"`. | 1. Cajero selecciona devolución en efectivo.<br>2. Envía `POST /api/returns`.<br>3. Backend ejecuta `with_for_update` y reingresa stock. | Código `HTTP 201 Created`. `refund_amount: 160.00`, `credit_note_code: null`, stock incrementado a 3 (+1) y salida de caja asentada. | Devolución en efectivo procesada con egreso contable de caja y stock restablecido a 3. | **APROBADO** |
| **CP-CU18-05** | **Rechazo por Prenda Usada o Sin Etiqueta Textil** | Cliente presenta prenda con manchas, deterioro o etiqueta cortada. | `condition: "damaged_or_no_tags"`. | 1. Cajero marca condición física no apta.<br>2. Envía `POST /api/returns`. | Código `HTTP 400 Bad Request`. Mensaje: *"La prenda debe estar intacta y conservar su etiqueta original (good_with_tags)"*. Stock intacto. | Rechazo HTTP 400 protegiendo la política de sanidad textil de la boutique. | **APROBADO** |
| **CP-CU18-06** | **Rechazo por Plazo de Devolución Expirado** | Compra realizada hace 20 días en boutique con plazo máximo de 7 días. | Venta con `created_at` antiguo que supera `max_days`. | 1. Cajero intenta procesar devolución fuera de plazo.<br>2. Envía `POST /api/returns`. | Código `HTTP 400 Bad Request`. Mensaje: *"El plazo máximo para devoluciones (7 días) ha expirado"*. Stock intacto. | Rechazo HTTP 400. La operación es bloqueada automáticamente. | **APROBADO** |
| **CP-CU18-07** | **Aislamiento Multitenant Estricto en Devoluciones** | Cajero de Empresa B intenta devolver un ticket perteneciente a Empresa A. | Token JWT con `tenant_id` de Moda Urbana y `sale_id` de Boutique Elegance. | 1. Petición autenticada intenta procesar venta ajena.<br>2. Envía `POST /api/returns`. | Código `HTTP 404 Not Found`. La venta no existe en el tenant del usuario. | Aislamiento multitenant protegido; cero filtración de comprobantes entre tenants. | **APROBADO** |
| **CP-CU18-08** | **Consulta y Listado Histórico de Devoluciones por Sucursal** | Sucursal cuenta con 2 devoluciones registradas en el día. | Petición `GET /api/returns?branch_id=...` con token de cajero de la sucursal. | 1. Cajero abre historial de devoluciones.<br>2. Backend filtra por `tenant_id` y `branch_id`. | Código `HTTP 200 OK`. Array con 2 registros conteniendo desglose de retención, montos y notas de crédito emitidas. | Histórico de sucursal cargado correctamente con trazabilidad contable completa. | **APROBADO** |

---

## 4. 📊 Resumen Estadístico Consolidado de Cobertura

```
========================================================================================
RESUMEN EJECUTIVO DE PRUEBAS DE CAJA NEGRA — SISTEMAS 2 (1RA Y 2DA PRESENTACIÓN)
========================================================================================
Total Casos de Prueba Formalizados:     69
Casos de Prueba Aprobados (PASSED):     69 (100%)
Casos de Prueba Fallidos (FAILED):       0 (0%)
Casos de Prueba Bloqueados:              0 (0%)
----------------------------------------------------------------------------------------
Distribución por Caso de Uso:
  [1ra Presentación]
  - CU01 (Registrar y Gestionar Empresas/Tenants):      3 Casos de Prueba  [100% OK]
  - CU02 (Gestionar Planes de Suscripción y Cuotas):    3 Casos de Prueba  [100% OK]
  - CU03 (Iniciar Sesión Multitenant con JWT):          3 Casos de Prueba  [100% OK]
  - CU04 (Gestionar Sucursales Bajo Límites del Plan):  4 Casos de Prueba  [100% OK]
  - CU05 (Gestionar Prendas y Variantes por Talla):     3 Casos de Prueba  [100% OK]
  - CU06 (Consultar Catálogo Online Facetado):          2 Casos de Prueba  [100% OK]
  - CU07 (Sincronizar y Descargar Catálogo Offline):    3 Casos de Prueba  [100% OK]
  - CU08 (Consultar Catálogo en Modo Desconectado):     2 Casos de Prueba  [100% OK]
  - CU09 (Comprar con Stripe y Despacho Condicionado):  2 Casos de Prueba  [100% OK]
  - CU10 (Crear Reserva Online con Vencimiento):        3 Casos de Prueba  [100% OK]
  [2da Presentación]
  - CU11 (Registrar Reserva de Prendas Offline):        4 Casos de Prueba  [100% OK]
  - CU12 (Atender y Resolver Conflictos Expiradas):     5 Casos de Prueba  [100% OK]
  - CU13 (Registrar Venta POS Desconectada Efectivo):   5 Casos de Prueba  [100% OK]
  - CU14 (Gestionar Bandeja Local Outbox PWA/SQLite):   4 Casos de Prueba  [100% OK]
  - CU15 (Sincronizar Lotes con Idempotencia Central):  3 Casos de Prueba  [100% OK]
  - CU16 (Resolver Conflictos y Quiebres de Stock):     4 Casos de Prueba  [100% OK]
  - CU17 (Cambio de Prenda con Cobro Diferencia Δ):     8 Casos de Prueba  [100% OK]
  - CU18 (Devolución con Retención 20-50% y NC):        8 Casos de Prueba  [100% OK]
----------------------------------------------------------------------------------------
Aislamiento Multitenant:                               Verificado al 100% (HTTP 404/403)
Políticas de Negocio Inviolables (P1, P2, P3, P4, P5): Cumplimiento Estricto Verificado
========================================================================================
```

---

## 5. ✍️ Conclusiones de Aseguramiento de Calidad

1. **Gobernanza del Modelo Multitenant:** El sistema verifica a nivel de middleware y dependencias de base de datos que ninguna entidad (prenda, venta, sucursal, reserva) sea accesible o modificable por un tenant diferente al consignado en el token JWT validado.
2. **Cumplimiento Incondicional de Políticas:** Las reglas críticas de negocio (Política 1 de cobro de diferencia $\Delta > 0$, Política 2 de retención 20%-50%, Política 3 de despacho tras pago Stripe confirmado, Política 4 de límites de sucursales y Política 5 de efectivo offline) actúan como barreras infranqueables en el controlador.
3. **Consistencia Transaccional y Tolerancia a Fallos:** La persistencia local y sincronización idempotente garantizan que no existan duplicidades de venta ni quiebres de inventario no asistidos, cumpliendo el estándar de robustez exigido por ICONIX y la cátedra de Sistemas 2.
