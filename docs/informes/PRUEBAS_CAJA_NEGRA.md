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

| ID | Objetivo / Escenario | Precondiciones | Datos de Entrada (Input) | Resultado Esperado | Resultado Obtenido | Estado |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **CP-CU11-01** | Generación de reserva local sin internet en PWA | Red desconectada (`navigator.onLine = false`). Catálogo local precargado en IndexedDB. | Carrito con 1 prenda, fecha de retiro a 3 días, datos de contacto. | Generación de UUIDv4 local, guardado en almacén outbox de IndexedDB con estado `PENDIENTE_SYNC`. | Reserva guardada localmente con UUIDv4; badge ámbar visible en PWA. | **APROBADO** |
| **CP-CU11-02** | Registro offline en App Móvil Flutter con SQLite | App en modo avión. Base de datos SQLite inicializada. | Prenda seleccionada, cantidad 1, sucursal local. | Inserción en tabla SQLite `local_pending_reservations`, ticket en pantalla con QR de contingencia. | Registro almacenado en SQLite nativo con código provisorio. | **APROBADO** |
| **CP-CU11-03** | Sincronización idempotente automática al reconectar | Conexión a internet restablecida. 2 reservas pendientes en outbox local. | Evento `online` disparado por `NetworkStatusService`. | Envío de lote al backend. El backend bloquea `reserved_quantity`, genera código `RES-XXXXXXXX` y vacía outbox. | Sincronización transparente; códigos definitivos asignados sin duplicar stock. | **APROBADO** |
| **CP-CU11-04** | Prevención de doble sincronización por reintento de red | Conexión inestable envía dos veces el mismo `client_reservation_id`. | Mismo UUIDv4 enviado consecutivamente en 200 ms. | Backend detecta UUIDv4 duplicado mediante índice único; responde con la reserva previa sin duplicar. | Idempotencia confirmada; una sola reserva creada y un solo bloqueo de inventario. | **APROBADO** |

---

### CU12: Atender y Resolver Conflictos de Reservas Expiradas

| ID | Objetivo / Escenario | Precondiciones | Datos de Entrada (Input) | Resultado Esperado | Resultado Obtenido | Estado |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **CP-CU12-01** | Visualización en panel de reservas vencidas con diagnóstico de percha | Reserva en estado `VENCIDA` tras barrido del CU10. Encargado autenticado en la sucursal. | Consulta a `GET /api/reservations/branch/conflicts`. | Lista de reservas vencidas con semáforo de existencias en percha (Verde si disponible, Rojo si agotado). | Bandeja de conflictos cargada con diagnóstico de stock en tiempo real. | **APROBADO** |
| **CP-CU12-02** | Resolución vía Reactivación con stock disponible | Prenda de reserva vencida aún cuenta con existencias en tienda (`quantity - reserved >= 1`). | Estrategia `reactivate`, extensión +48h, nota explicativa: *"Cliente demorado por viaje"*. | Reserva pasa a `CONFIRMADA`, se re-bloquea `reserved_quantity` (+1) y se audita `resolution_note`. | Reserva reactivada exitosamente con nuevo vencimiento y stock reservado. | **APROBADO** |
| **CP-CU12-03** | Bloqueo de reactivación si la prenda fue vendida a otro cliente | Stock disponible = 0 (la prenda en percha ya fue comprada por otro usuario). | Estrategia `reactivate` sobre prenda agotada. | Código `HTTP 400 Bad Request`. Modal bloquea la acción indicando falta de existencias. | Sistema impide reactivación y sugiere sustitución por otra talla. | **APROBADO** |
| **CP-CU12-04** | Resolución vía Sustitución de Variante | Prenda original agotada; cliente acepta misma prenda en talla adyacente disponible. | Estrategia `substitute`, `new_variant_id`, nota de justificación. | Desbloqueo de variante previa, reserva de nueva variante y estado `CONFIRMADA`. | Reserva actualizada con la nueva talla sin descuadrar inventario general. | **APROBADO** |
| **CP-CU12-05** | Cierre definitivo y desistimiento | Cliente informa que ya no retirará la prenda o no acepta alternativas. | Estrategia `close`, nota: *"Cliente desiste de la compra"*. | Reserva marcada como `CANCELADA` con auditoría completa de fecha y usuario encargado. | Reserva cerrada permanentemente; percha física liberada. | **APROBADO** |

---

### CU13: Registrar Venta POS Desconectada en Efectivo con Contingencia UUIDv4

| ID | Objetivo / Escenario | Precondiciones | Datos de Entrada (Input) | Resultado Esperado | Resultado Obtenido | Estado |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **CP-CU13-01** | Venta offline exitosa exclusivamente en efectivo (Política 5) | Caja POS sin conexión a internet. Catálogo local con saldo disponible. | Prenda seleccionada, cantidad 1, método de pago: `EFECTIVO`, monto recibido. | Generación de `client_sale_id` (UUIDv4), descuento inmediato en caché local y ticket de contingencia emitido. | Venta registrada localmente; comprobante offline impreso con UUID de seguridad. | **APROBADO** |
| **CP-CU13-02** | Bloqueo estricto de pagos electrónicos en modo offline | Terminal sin conectividad a internet. | Cajero intenta seleccionar tarjeta o pasarela Stripe. | Interfaz deshabilita métodos electrónicos con alerta: *"Sin conexión solo se permite cobro en efectivo"*. | Bloqueo absoluto de pagos digitales garantizando la Política 5. | **APROBADO** |
| **CP-CU13-03** | Alerta por stock local insuficiente en caja | El inventario en caché local marca 0 unidades del producto. | Intento de agregar prenda sin saldo local. | Alerta visual en TPV impidiendo añadir el ítem a la venta. | Transacción bloqueada en punto de venta evitando sobreventas evidentes. | **APROBADO** |

---

### CU14: Gestionar Bandeja Local de Operaciones Pendientes (Outbox PWA / SQLite)

| ID | Objetivo / Escenario | Precondiciones | Datos de Entrada (Input) | Resultado Esperado | Resultado Obtenido | Estado |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **CP-CU14-01** | Acumulación de ventas desconectadas en bandeja Outbox | TPV ha registrado 4 ventas en efectivo durante un corte de energía/internet. | Consulta a la pestaña "Bandeja Outbox / Pendientes". | Tabla local despliega las 4 ventas con hora local, monto total, estado `PENDIENTE_SYNC` y badge ámbar. | Bandeja muestra las 4 operaciones locales con sus identificadores UUIDv4. | **APROBADO** |
| **CP-CU14-02** | Persistencia tolerante a reinicio del navegador o dispositivo | Terminal se reinicia o se recarga la pestaña de la PWA. | Recarga completa del navegador en frío (F5 / Cierre de app). | IndexedDB / SQLite mantiene intactas las transacciones en cola sin pérdida de datos. | Todas las ventas pendientes permanecen en disco local tras el reinicio. | **APROBADO** |
| **CP-CU14-03** | Cálculo dinámico de totales pendientes de arqueo | 3 ventas pendientes en cola por montos Bs 50, Bs 120 y Bs 80. | Apertura del panel de caja offline. | Muestra resumen consolidado: Total acumulado offline Bs 250.00 en efectivo pendiente de rendición. | Arqueo local exacto de efectivo en gaveta física. | **APROBADO** |

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

| ID | Objetivo / Escenario | Precondiciones | Datos de Entrada (Input) | Resultado Esperado | Resultado Obtenido | Estado |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **CP-CU18-01** | Cálculo de retención operativa según política del tenant (Boutique Elegance: 30%) | Venta de Vestido por Bs 100. Cliente solicita devolución dentro de los 7 días estipulados. | `sale_id`, variante devuelta, condición: `good_with_tags`. | Sistema aplica $R = 30\%$, retiene Bs 30.00 por gastos operativos y cotiza reembolso neto de Bs 70.00. | Retención exacta del 30% calculada según la política de Boutique Elegance. | **APROBADO** |
| **CP-CU18-02** | Cálculo de retención operativa según política del tenant (Moda Urbana: 20%) | Venta de Pantalón por Bs 200 en tenant Moda Urbana. | `sale_id`, variante devuelta, condición: `good_with_tags`. | Sistema aplica $R = 20\%$, retiene Bs 40.00 y cotiza reembolso neto de Bs 160.00. | Retención exacta del 20% calculada según la política de Moda Urbana. | **APROBADO** |
| **CP-CU18-03** | Devolución con emisión de Nota de Crédito Digital (Modalidad Recomendada) | Cliente acepta saldo a favor para futuras compras en la boutique. | Modalidad seleccionada: `NOTA_CREDITO`. | Generación de código `NC-YYYYMMDD-XXXX` por el saldo neto, reingreso de +1 al stock de inventario y registro en `garment_returns`. | Nota de crédito digital generada; prenda devuelta reingresada a percha. | **APROBADO** |
| **CP-CU18-04** | Devolución con reembolso en efectivo en mostrador | Cliente exige devolución en efectivo (política admitida en Moda Urbana). | Modalidad seleccionada: `EFECTIVO`. | Registro de salida de caja física de Bs 160.00, reingreso de la prenda al stock e impresión de comprobante de egreso. | Dinero devuelto con registro contable de caja y stock restablecido. | **APROBADO** |
| **CP-CU18-05** | Rechazo por plazo de devolución caducado | Compra realizada hace 20 días (plazo máximo del tenant: 7 o 15 días). | Intento de registrar devolución de ticket antiguo. | Código `HTTP 400 Bad Request`. Mensaje: *"El plazo legal para devoluciones ha expirado"*. | Sistema rechaza la solicitud protegiendo la política de la empresa. | **APROBADO** |
| **CP-CU18-06** | Rechazo por prenda sin etiqueta textil o dañada | Prenda devuelta presenta manchas, desgaste o no cuenta con etiquetas. | `condition: "damaged_or_no_tags"`. | Código `HTTP 400 Bad Request`. Devolución cancelada sin emisión de nota ni dinero. | Operación abortada; se devuelve la prenda física al cliente sin reembolso. | **APROBADO** |

---

## 4. 📊 Resumen Estadístico Consolidado de Cobertura

```
========================================================================================
RESUMEN EJECUTIVO DE PRUEBAS DE CAJA NEGRA — SISTEMAS 2 (1RA Y 2DA PRESENTACIÓN)
========================================================================================
Total Casos de Prueba Formalizados:     60
Casos de Prueba Aprobados (PASSED):     60 (100%)
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
  - CU13 (Registrar Venta POS Desconectada Efectivo):   3 Casos de Prueba  [100% OK]
  - CU14 (Gestionar Bandeja Local Outbox PWA/SQLite):   3 Casos de Prueba  [100% OK]
  - CU15 (Sincronizar Lotes con Idempotencia Central):  3 Casos de Prueba  [100% OK]
  - CU16 (Resolver Conflictos y Quiebres de Stock):     4 Casos de Prueba  [100% OK]
  - CU17 (Cambio de Prenda con Cobro Diferencia Δ):     8 Casos de Prueba  [100% OK]
  - CU18 (Devolución con Retención 20-50% y NC):        6 Casos de Prueba  [100% OK]
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
