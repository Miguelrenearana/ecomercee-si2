# Sesión 2026-11-02 — Implementación Fullstack de CU18: Procesar Devolución de Prenda con Retención Operativa (20%–50%) y Nota de Crédito

**Fecha:** 2 de Noviembre de 2026  
**Autor:** Antigravity Architect  
**Caso de Uso:** `CU18: Procesar Devolución de Prenda con Retención Operativa (20%–50%) y Nota de Crédito` (Presentación 2 - Bloque C)  
**Estado:** 100% Implementado, Verificado y Documentado

---

## 1. Alcance y Políticas de Negocio Aplicadas

Se implementó el ciclo completo de devolución de prendas en mostrador POS para la plataforma SaaS multitenant, respetando rigurosamente la **Política de Negocio 2 (P-Ten-03)**:
1. **Retención Operativa por Tenant:**
   - La plataforma restringe la tasa de retención $R$ al rango $[20\%, 50\%]$.
   - Boutique Elegance: $R = 30\%$, reembolso neto al cliente $70\%$, plazo máx. 7 días.
   - Moda Urbana: $R = 20\%$, reembolso neto al cliente $80\%$, plazo máx. 15 días.
   - En caso de no tener política explícita en `Company.settings`, se aplica por defecto $R = 20\%$ y plazo máx. de 30 días.
2. **Condición de Prenda Inviolable:**
   - Solo se aceptan prendas en estado intacto con etiqueta original adherida (`good_with_tags`). Prendas usadas, deterioradas o sin etiqueta son rechazadas (`HTTP 400 Bad Request`).
3. **Reingreso Físico Atómico de Stock:**
   - Reingreso de la prenda física devuelta a la tabla `inventory` (`quantity += 1`) utilizando bloqueo pesimista de fila (`with_for_update`) para evitar condiciones de carrera.
4. **Modalidades de Liquidación:**
   - **Nota de Crédito Digital:** Generación de código único formal `NC-YYYYMMDD-XXXX` para compras futuras.
   - **Efectivo:** Reembolso inmediato en mostrador.
5. **Auditoría y Trazabilidad:**
   - Registro transaccional en la tabla `garment_returns` vinculada a la venta, sucursal, usuario operador y empresa tenant.

---

## 2. Modificaciones en Backend (`p5_gestion_ventas_pos`)

### A. Schemas Pydantic v2
* [`backend/app/packages/p5_gestion_ventas_pos/schemas/return_schema.py`](file:///c:/Users/PERSONAL/ecommerce-SI2/backend/app/packages/p5_gestion_ventas_pos/schemas/return_schema.py):
  - `RefundMethodEnum`: `NOTA_CREDITO`, `EFECTIVO`.
  - `ReturnQuoteRequest`: Entrada para cotización previa con `sale_id`, `variant_id`.
  - `ReturnQuoteResponse`: Desglose financiero con `original_price`, `retention_rate`, `retention_amount`, `refund_amount`, `max_days`, `is_within_period`.
  - `GarmentReturnCreate`: Solicitud formal de devolución con validaciones de campos.
  - `GarmentReturnResponse`: Salida formal con datos de auditoría y `credit_note_code`.

### B. Servicio de Dominio
* [`backend/app/packages/p5_gestion_ventas_pos/services/return_service.py`](file:///c:/Users/PERSONAL/ecommerce-SI2/backend/app/packages/p5_gestion_ventas_pos/services/return_service.py):
  - `_get_tenant_return_policy(company)`: Lectura segura de políticas de retención y plazos por tenant con validación de límites $[20\%, 50\%]$.
  - `generate_credit_note_code(tenant_id)`: Generador de códigos alfanuméricos únicos y auditables.
  - `quote_garment_return(...)`: Cotización en vivo con validación de pertenencia al tenant.
  - `process_garment_return(...)`: Transacción atómica completa:
    1. Comprobación de existencia de venta e ítem.
    2. Validación de estado de prenda (`good_with_tags`).
    3. Validación de ventana temporal de devolución (`days_diff <= max_days`).
    4. Bloqueo de fila e incremento de inventario (`Inventory.quantity += 1` con `with_for_update`).
    5. Inserción en `garment_returns` y confirmación (`db.commit()`).

### C. Endpoints REST y Montaje
* [`backend/app/packages/p5_gestion_ventas_pos/routes/return_routes.py`](file:///c:/Users/PERSONAL/ecommerce-SI2/backend/app/packages/p5_gestion_ventas_pos/routes/return_routes.py):
  - `POST /api/returns/quote`: Cotización previa de retención y reembolso.
  - `POST /api/returns`: Procesamiento de la devolución y emisión de nota de crédito/efectivo.
  - `GET /api/returns`: Listado histórico de devoluciones con filtro por sucursal.
* [`backend/app/packages/p5_gestion_ventas_pos/router.py`](file:///c:/Users/PERSONAL/ecommerce-SI2/backend/app/packages/p5_gestion_ventas_pos/router.py): Montaje de `return_router`.

---

## 3. Modificaciones en Frontend Web PWA (Angular 21)

* **Modelos y API:**
  - [`frontend/src/app/features/shared/models/sale.model.ts`](file:///c:/Users/PERSONAL/ecommerce-SI2/frontend/src/app/features/shared/models/sale.model.ts): Interfaces `ReturnQuoteResponse` y `GarmentReturn`.
  - [`frontend/src/app/features/shared/services/sales-api.service.ts`](file:///c:/Users/PERSONAL/ecommerce-SI2/frontend/src/app/features/shared/services/sales-api.service.ts): Integración de métodos `quoteReturn(...)` y `processReturn(...)`.
* **Componente de Caja POS (`caja-page.component`):**
  - Botón de "Devolución" en la barra de herramientas de caja con icono de rotación.
  - Modal adaptativo con búsqueda de ticket, selección de prenda a devolver y cotizador reactivo en tiempo real con tarjeta de desglose financiero (Monto Original, Retención Operativa % y Reembolso Neto).
  - Selector de método de liquidación (`Nota de Crédito` o `Efectivo en Caja`).
  - Modal de confirmación y emisión de comprobante con código de Nota de Crédito digital (`NC-YYYYMMDD-XXXX`), monto reembolsado y detalle de reingreso a almacén.
  - Verificación TypeScript: `npx tsc --noEmit` completada con **0 errores**.

---

## 4. Modelado UML para Enterprise Architect v15 (JScript)

* **Diagrama de Comunicación / Robustez ICONIX:**
  - Archivo: [`docsUML/CUrobustez/CU18_comm_devolucion_prenda_EA.js`](file:///c:/Users/PERSONAL/ecommerce-SI2/docsUML/CUrobustez/CU18_comm_devolucion_prenda_EA.js)
  - Actores oficiales de la Ficha Técnica: `Cliente` (iniciador presencial y decisor de reembolso) y `Cajero` (operador POS y verificador físico).
  - Fronteras: `CajaPageComponent` (POS base), `ModalDevolucionPrenda` (cotización e inspección), `ModalComprobanteNotaCredito` (comprobante digital).
  - Controladores: `ReturnRoutes` (API REST / HTTP FastAPI) y `ReturnService` (Servicio de Dominio).
  - Entidades: `Sale`, `Company`, `Inventory`, `GarmentReturn`.
* **Diagrama de Secuencia:**
  - Archivo: [`docsUML/CUSecuencia/CU18_secuencia_devolucion_prenda_EA.js`](file:///c:/Users/PERSONAL/ecommerce-SI2/docsUML/CUSecuencia/CU18_secuencia_devolucion_prenda_EA.js)
  - Parámetros UML, nombres y funciones() tal como en el código implementado.
  - Secuencia completa: solicitud presencial, apertura modal, cotización API en tiempo real, acuerdo de modalidad con el cliente, validación de estado textil, reingreso de stock con `with_for_update()`, emisión de `NC-...` y entrega de comprobante.
  - Fragmentos combinados `alt` para evaluación de prenda (`good_with_tags`) y selección de método de liquidación (Nota de Crédito vs Efectivo).

---

## 5. Pruebas y Verificaciones

1. **Suite de Integración Automatizada CU18:**
   - Archivo: [`backend/tests/test_cu18_garment_return.py`](file:///c:/Users/PERSONAL/ecommerce-SI2/backend/tests/test_cu18_garment_return.py)
   - Pruebas unitarias y de integración (8 tests):
     - `test_quote_return_tenant_elegance_30_percent`: PASSED
     - `test_quote_return_tenant_urbana_20_percent`: PASSED
     - `test_reject_return_damaged_garment`: PASSED (HTTP 400 por no cumplir `good_with_tags`)
     - `test_reject_return_expired_period`: PASSED (HTTP 400 por superar plazo permitido)
     - `test_process_return_credit_note_success`: PASSED (código `NC-...` generado, stock incrementado +1)
     - `test_process_return_cash_refund_success`: PASSED (reembolso en efectivo)
     - `test_multitenant_isolation_return`: PASSED (aislamiento multitenant verificado)
     - `test_list_returns_by_branch`: PASSED
2. **Suite de Regresión Completa:**
   - 26 tests en total ejecutados (`test_cu04`, `test_cu10`, `test_cu17`, `test_cu18`): **26/26 PASSED in 15.41s**.
