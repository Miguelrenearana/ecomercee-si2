# Sesión de Desarrollo — 08 de Noviembre de 2026: Interfaz de Gestión de Planes Comerciales y Suscripciones SaaS (CU02)

## 1. Alcance y Caso de Uso Abordado
- **Caso de Uso:** `CU02: Gestionar Planes de Suscripción y Cuotas Comerciales`
- **Presentación:** 2da y 3ra Presentación (Sistemas 2)
- **Actores:** Superadministrador (`Superadmin`)
- **Capas Afectadas:** Backend FastAPI (`p0_saas_plataforma`) y Frontend Web Angular 21 (PWA).

---

## 2. Cambios Implementados en Backend (`p0_saas_plataforma`)

1. **Esquemas Pydantic v2 ([`plan_schema.py`](file:///c:/Users/PERSONAL/ecommerce-SI2/backend/app/packages/p0_saas_plataforma/schemas/plan_schema.py)):**
   - Incorporación de `PlanUpdate` con campos opcionales (`name`, `description`, `max_branches`, `has_ai_access`, `price_monthly`, `is_active`).
   - Incorporación de `PlanStatusUpdate` para conmutación de estado booleano `is_active`.
2. **Rutas REST ([`plan_routes.py`](file:///c:/Users/PERSONAL/ecommerce-SI2/backend/app/packages/p0_saas_plataforma/routes/plan_routes.py)):**
   - `GET /saas/plans?include_inactive=true`: Listado completo para el Superadmin.
   - `GET /saas/plans/{plan_id}`: Detalle de un plan específico.
   - `POST /saas/plans`: Creación de nuevos planes comerciales.
   - `PUT /saas/plans/{plan_id}`: Actualización completa de tarifas, límites y flags de IA.
   - `PATCH /saas/plans/{plan_id}/status`: Conmutación de activación / pausa.
   - `DELETE /saas/plans/{plan_id}`: Eliminación física si no posee suscripciones vinculadas o desactivación preventiva automática protegiendo integridad referencial.
3. **Ajuste de Cuota Empresarial a 223 Sucursales:**
   - En [`plan_routes.py`](file:///c:/Users/PERSONAL/ecommerce-SI2/backend/app/packages/p0_saas_plataforma/routes/plan_routes.py), [`tenant_service.py`](file:///c:/Users/PERSONAL/ecommerce-SI2/backend/app/packages/p0_saas_plataforma/services/tenant_service.py) y [`quota_service.py`](file:///c:/Users/PERSONAL/ecommerce-SI2/backend/app/packages/p0_saas_plataforma/services/quota_service.py), se estableció el techo máximo del Plan EMPRESARIAL en **223 sucursales activas**.

---

## 3. Cambios Implementados en Frontend Web (Angular 21)

1. **Modelos y DTOs ([`company.model.ts`](file:///c:/Users/PERSONAL/ecommerce-SI2/frontend/src/app/core/models/company.model.ts)):**
   - Agregadas interfaces `PlanCreateDto` y `PlanUpdateDto`.
   - Admitido el estado `'trialing'` en la interfaz `Subscription`.
2. **Servicio API ([`company.service.ts`](file:///c:/Users/PERSONAL/ecommerce-SI2/frontend/src/app/core/services/company.service.ts)):**
   - Agregados métodos `getPlanById()`, `createPlan()`, `updatePlan()`, `togglePlanStatus()`, `deletePlan()`.
3. **Página de Catálogo de Planes ([`plans-page.component.ts`](file:///c:/Users/PERSONAL/ecommerce-SI2/frontend/src/app/features/superadmin/pages/plans-page.component.ts)):**
   - Diseñada bajo la directriz `/design-taste-frontend` (`references/app-screens.md`).
   - Barra de pestañas conectando "Empresas Contratantes" $\leftrightarrow$ "Planes & Cuotas SaaS".
   - 4 Tarjetas métricas ejecutivas (Planes Activos, Cuota Máx. de Sucursales, Rango de Precios, Cobertura de IA).
   - Cuadrícula con visualización clara de tarifas, capacidades de IA (Gemini RAG + ML), cuotas de sedes y botones de acción ("Editar Plan", "Pausar/Activar").
4. **Modal de Gestión ([`plan-form-modal.component.ts`](file:///c:/Users/PERSONAL/ecommerce-SI2/frontend/src/app/features/superadmin/components/plan-form-modal.component.ts)):**
   - Creación y edición reactiva de planes comerciales con validaciones numéricas, inputs formateados y feedback mediante Sonner toast.
5. **Ruteo y Navegación:**
   - Enlace añadido en la barra lateral de Superadmin ([`app-shell.component.ts`](file:///c:/Users/PERSONAL/ecommerce-SI2/frontend/src/app/core/layouts/app-shell.component.ts)).
   - Ruta registrada en [`app.routes.ts`](file:///c:/Users/PERSONAL/ecommerce-SI2/frontend/src/app/app.routes.ts) bajo `/app/superadmin/plans`.
