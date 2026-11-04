# NEXT STEPS — FASHIONSTORE SAAS MULTITENANT
### Hoja de Ruta Operativa y Próximos Pasos (25 Casos de Uso Oficiales)
**Fecha:** 03 de Noviembre de 2026

---

## 🎯 Estado de Situación: 20 de 25 Casos de Uso Implementados (100% Verificados)

### Casos de Uso Listos y Funcionales (Presentación 1 y 2 al 100% + CU19 y CU21):
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
- [x] **`CU15` – Sincronizar Lotes de Ventas con Idempotencia Central (`sync_operations`)** (`p5_gestion_ventas_pos`)
- [x] **`CU16` – Gestionar y Resolver Conflictos de Ventas Offline y Quiebres de Stock Central** (`p5_gestion_ventas_pos`)
- [x] **`CU17` – Procesar Cambio de Prenda por Talla con Cobro de Diferencia y Estado** (`p5_gestion_ventas_pos`)
- [x] **`CU18` – Procesar Devolución de Prenda con Retención Operativa y Nota de Crédito** (`p5_gestion_ventas_pos`)
- [x] **`CU19` – Localizar Sucursales y Trazar Rutas (Carril A: Mobile OpenStreetMap / ORS)** (`p1_gestion_usuarios_acceso` + Flutter)
- [x] **`CU21` – Exportar Reportes Empresariales a Formatos PDF y Excel (Carril B: Reportes)** (`p6_inteligencia_analitica`)

---

## 🚀 Carriles de Trabajo en Paralelo para la 3ra Presentación (5 CUs Restantes)

```
[Carril A: Mobile] ---------> CU19 (Mapas / Rutas Flutter con OpenStreetMap / ORS) [¡LISTO Y VERIFICADO!]
[Carril B: Reportes] -------> CU21 (Exportación PDF / Excel) [¡LISTO Y VERIFICADO!]
[Carril C: Pipeline ML] ----> CU22 (Dataset Sintético de Moda Textil)
                                   │
                                   ├──> [Chat C1] CU23 (ML Supervisado - Demanda por Talla) ──┐
                                   └──> [Chat C2] CU24 (ML No Sup. - Segmentación K-Means) ───┼──> CU25 (Dashboard)
[Carril D: Generative AI] --> CU20 (Gemini RAG por Voz Multitenant)
```

### Tareas Inmediatas Pendientes:
1. **Carril D — Generative AI (`CU20`):**
   - RAG multitenant con Gemini API y reconocimiento/síntesis por voz para reportes ejecutivos.
2. **Carril C — Machine Learning Pipeline (`CU22`):**
   - Script generador estocástico en Python (`numpy`, `pandas`) para simular 10,000+ compras con estacionalidad boliviana y atributos textiles.
3. **Carril C1 — ML Supervisado (`CU23`):**
   - Modelo de regresión Scikit-Learn (`RandomForestRegressor`) para pronóstico de demanda de prendas a 4 semanas ($R^2 \ge 0.82$).
4. **Carril C2 — ML No Supervisado (`CU24`):**
   - Modelo de clustering K-Means para segmentación RFM multitenant.
5. **Dashboard Ejecutivo (`CU25`):**
   - Tablero unificado con métricas en tiempo real, KPIs comerciales y visualizaciones predictivas.
