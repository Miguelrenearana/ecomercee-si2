# NEXT STEPS — FASHIONSTORE SAAS MULTITENANT
### Hoja de Ruta Operativa y Próximos Pasos (25 Casos de Uso Oficiales)
**Fecha:** 03 de Noviembre de 2026

---

## 🎯 Estado de Situación: 18 de 25 Casos de Uso Implementados (100% Verificados)

### Casos de Uso Listos y Funcionales (Presentación 1 y 2 COMPLETADAS al 100%):
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

---

## 🚀 Tareas Inmediatas de Implementación (Presentación 3 — 7 CUs Restantes)

### Bloque D: Despacho, Rutas de Entrega y Geolocalización Móvil (`CU19` y `CU20`)
1. **`CU19` – Entregar y Despachar Pedidos Digitales (Fulfillment y Delivery):**
   - [ ] Asignación de pedidos pagados (`payment_status = 'paid'`) a personal de reparto.
   - [ ] Cambio de estado de despacho y confirmación de entrega física o en tienda.
2. **`CU20` – Calcular y Trazar Rutas Óptimas de Entrega con OpenStreetMap (Flutter & PWA):**
   - [ ] Integración de `flutter_map` y OpenRouteService para cálculo de rutas multisede.
   - [ ] Marcadores georreferenciados de sucursales y destinos de clientes.

### Bloque E: Inteligencia Artificial Generativa y Asistente de Estilo (`CU21` y `CU22`)
1. **`CU21` – Consultar Asistente de Estilo Virtual con Google Gemini RAG (Voz y Texto):**
   - [ ] RAG contextual multitenant sobre catálogo y stock real de la empresa contratante.
   - [ ] Interfaz de audio/voz interactiva con Gemini Live API.
2. **`CU22` – Recomendar Outfits y Combinaciones Personalizadas:**
   - [ ] Generación multimodal de combinaciones basadas en ocasión, clima y perfil corporal.

### Bloque F: Modelos de Machine Learning y Analítica Predictiva (`CU23` al `CU25`)
1. **`CU23` – Predecir Demanda de Prendas e Inventario (Modelo Supervisado - Scikit-Learn):**
   - [ ] Regresión lineal / Random Forest sobre histórico de ventas por temporada y talla.
2. **`CU24` – Segmentar Clientes por Patrones de Compra (Modelo No Supervisado - K-Means):**
   - [ ] Clustering RFM (Recencia, Frecuencia, Valor Monetario) para campañas de fidelización.
3. **`CU25` – Visualizar Dashboard Analítico Ejecutivo Multitenant:**
   - [ ] Gráficos de dispersión, embudo de ventas, métricas financieras y exportación ejecutiva.
