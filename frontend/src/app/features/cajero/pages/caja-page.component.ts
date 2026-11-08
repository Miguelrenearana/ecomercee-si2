import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { toast } from '@spartan-ng/brain/sonner';

import { HlmBadgeImports } from '../../../components/badge/src';
import { HlmButton } from '../../../components/button/src';
import { HlmCardImports } from '../../../components/card/src';
import { HlmInputImports } from '../../../components/input/src';
import { NetworkStatusService } from '../../../core/offline/network-status.service';
import { IdbSalesService, PendingOfflineSale } from '../../../core/offline/idb-sales.service';
import { getErrorMessage } from '../../../core/utils/http-error.util';
import { requestWithToast } from '../../../core/utils/request-toast.util';
import { CatalogProduct, CatalogProductVariant } from '../../shared/models/catalog.model';
import { CreateSaleRequest, GarmentReturn, ReturnQuoteResponse, Sale } from '../../shared/models/sale.model';
import { CatalogApiService } from '../../shared/services/catalog-api.service';
import { SalesApiService } from '../../shared/services/sales-api.service';
import { SessionService } from '../../shared/services/session.service';

type SelectedSaleItem = {
  variant_id: string;
  product_name: string;
  variant_sku: string;
  size_name: string | null;
  color_name: string | null;
  unit_price: string;
  original_unit_price: string;
  quantity: number;
  image_url: string | null;
};

@Component({
  selector: 'app-cajero-caja-page',
  standalone: true,
  imports: [CommonModule, FormsModule, HlmButton, ...HlmBadgeImports, ...HlmCardImports, ...HlmInputImports],
  templateUrl: './caja-page.component.html',
})
export class CajaPageComponent {
  private readonly catalogApi = inject(CatalogApiService);
  private readonly salesApi = inject(SalesApiService);
  private readonly session = inject(SessionService);
  protected readonly network = inject(NetworkStatusService);
  protected readonly idbSales = inject(IdbSalesService);

  protected readonly searchTerm = signal('');
  protected readonly products = signal<CatalogProduct[]>([]);
  protected readonly selectedItems = signal<SelectedSaleItem[]>([]);
  protected readonly lastSale = signal<Sale | null>(null);
  protected readonly lastOfflineSale = signal<PendingOfflineSale | null>(null);
  protected readonly showReceiptModal = signal(false);

  protected readonly loadingProducts = signal(false);
  protected readonly submitting = signal(false);
  protected readonly cashReference = signal('');
  protected readonly cashReceived = signal<number | null>(null);
  protected readonly Number = Number;

  // Simulación de modo desconectado para pruebas operativas
  protected readonly simulatedOffline = signal(false);

  protected readonly isOfflineEffective = computed(() => !this.network.isOnline() || this.simulatedOffline());
  protected readonly pendingOutboxCount = computed(() => this.idbSales.getPendingCount());

  protected readonly branchId = computed(() => this.session.user()?.branch_id ?? null);
  protected readonly branchName = computed(() => this.session.user()?.branch_name ?? 'Sucursal Central');
  protected readonly cashierName = computed(() => this.session.user()?.name ?? 'Cajero en Turno');

  protected readonly subtotal = computed(() =>
    this.selectedItems().reduce((sum, item) => sum + Number(item.original_unit_price) * item.quantity, 0).toFixed(2)
  );
  protected readonly discount = computed(() =>
    this.selectedItems().reduce((sum, item) => sum + (Number(item.original_unit_price) - Number(item.unit_price)) * item.quantity, 0).toFixed(2)
  );
  protected readonly total = computed(() =>
    (Number(this.subtotal()) - Number(this.discount())).toFixed(2)
  );

  protected readonly changeAmount = computed(() => {
    const received = this.cashReceived();
    const tot = Number(this.total());
    if (received === null || received < tot) return '0.00';
    return (received - tot).toFixed(2);
  });

  // =========================================================================
  // LOGICA DEL CU14: Bandeja Local de Operaciones Pendientes (Outbox PWA)
  // =========================================================================
  protected readonly activeTab = signal<'tpv' | 'outbox'>('tpv');
  protected readonly outboxSales = signal<PendingOfflineSale[]>([]);
  protected readonly syncingOutbox = signal(false);
  protected readonly verifyingOutbox = signal(false);

  protected readonly pendingSales = computed(() => this.outboxSales().filter((s) => !s.synced));
  protected readonly syncedSales = computed(() => this.outboxSales().filter((s) => s.synced));
  protected readonly totalPendingCash = computed(() =>
    this.pendingSales().reduce((sum, s) => sum + s.total_amount, 0).toFixed(2)
  );

  protected switchTab(tab: 'tpv' | 'outbox'): void {
    this.activeTab.set(tab);
    if (tab === 'outbox') {
      this.refreshOutbox();
    }
  }

  protected refreshOutbox(): void {
    this.outboxSales.set(this.idbSales.getPending());
  }

  protected openSaleDetail(sale: PendingOfflineSale): void {
    this.lastOfflineSale.set(sale);
    this.lastSale.set(null);
    this.showReceiptModal.set(true);
  }

  protected removeSaleFromOutbox(clientSaleId: string): void {
    this.idbSales.removePending(clientSaleId);
    this.refreshOutbox();
    toast.success('Comprobante descartado de la bandeja local.');
  }

  protected clearSyncedFromOutbox(): void {
    this.idbSales.clearSynced();
    this.refreshOutbox();
    toast.success('Comprobantes sincronizados purgados de la memoria local.');
  }

  protected async syncSingleSale(sale: PendingOfflineSale): Promise<void> {
    if (this.isOfflineEffective()) {
      toast.error('No se puede sincronizar: el terminal está en modo desconectado.');
      return;
    }

    try {
      const payload: CreateSaleRequest = {
        branch_id: sale.branch_id,
        payment_method: 'cash',
        cash_reference: `Sincronización Outbox - Ticket ${sale.sale_code}`,
        client_sale_id: sale.client_sale_id,
        is_offline: true,
        items: sale.items.map((i) => ({ variant_id: i.variant_id, quantity: i.quantity })),
      };

      await firstValueFrom(this.salesApi.createSale(payload));
      this.idbSales.markAsSynced(sale.client_sale_id);
      this.refreshOutbox();
      toast.success(`Ticket ${sale.sale_code} sincronizado exitosamente con el servidor.`);
    } catch (error) {
      const msg = getErrorMessage(error, 'Fallo al sincronizar venta.');
      this.idbSales.markAsError(sale.client_sale_id, msg);
      this.refreshOutbox();
      toast.error(msg);
    }
  }

  protected async syncAllPending(): Promise<void> {
    if (this.isOfflineEffective()) {
      toast.error('No se puede sincronizar: el terminal está en modo desconectado.');
      return;
    }

    const pending = this.pendingSales();
    if (pending.length === 0) {
      toast.info('No hay operaciones pendientes de sincronizar.');
      return;
    }

    this.syncingOutbox.set(true);
    let successCount = 0;
    let failCount = 0;

    for (const sale of pending) {
      try {
        const payload: CreateSaleRequest = {
          branch_id: sale.branch_id,
          payment_method: 'cash',
          cash_reference: `Sincronización Lote Outbox - Ticket ${sale.sale_code}`,
          client_sale_id: sale.client_sale_id,
          is_offline: true,
          items: sale.items.map((i) => ({ variant_id: i.variant_id, quantity: i.quantity })),
        };

        await firstValueFrom(this.salesApi.createSale(payload));
        this.idbSales.markAsSynced(sale.client_sale_id);
        successCount++;
      } catch (err) {
        failCount++;
        this.idbSales.markAsError(sale.client_sale_id, getErrorMessage(err, 'Error de red'));
      }
    }

    this.syncingOutbox.set(false);
    this.refreshOutbox();

    if (failCount === 0) {
      toast.success(`Todas las ventas offline (${successCount}) han sido sincronizadas.`);
    } else {
      toast.warning(`Sincronización parcial: ${successCount} exitosas, ${failCount} con error.`);
    }
  }

  protected async checkOutboxStatusWithServer(): Promise<void> {
    if (this.isOfflineEffective()) {
      toast.error('Se requiere conexión activa para verificar con el servidor.');
      return;
    }

    const all = this.outboxSales();
    if (all.length === 0) {
      toast.info('No hay comprobantes locales para verificar.');
      return;
    }

    this.verifyingOutbox.set(true);
    try {
      const ids = all.map((s) => s.client_sale_id);
      const res = await firstValueFrom(this.salesApi.checkOfflineStatus(ids));
      const syncedIds = res.data?.synced_ids ?? [];

      let updated = 0;
      for (const id of syncedIds) {
        const local = all.find((s) => s.client_sale_id === id);
        if (local && !local.synced) {
          this.idbSales.markAsSynced(id);
          updated++;
        }
      }

      this.refreshOutbox();
      if (updated > 0) {
        toast.success(`Verificación completa: ${updated} ventas fueron confirmadas por el servidor.`);
      } else {
        toast.info('Verificación completa: No se encontraron ventas previamente asentadas.');
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'No se pudo contactar al servidor para verificar estado.'));
    } finally {
      this.verifyingOutbox.set(false);
    }
  }

  // =========================================================================
  // LOGICA DEL CU18: Estados de Devolución de Prenda y Nota de Crédito
  // =========================================================================
  protected readonly showReturnModal = signal(false);
  protected readonly returnSaleIdInput = signal('');
  protected readonly foundSaleForReturn = signal<Sale | null>(null);
  protected readonly loadingSaleLookup = signal(false);
  protected readonly selectedReturnVariantId = signal<string | null>(null);
  protected readonly returnCondition = signal<'good_with_tags' | 'damaged_or_no_tags'>('good_with_tags');
  protected readonly refundMethod = signal<'NOTA_CREDITO' | 'EFECTIVO'>('NOTA_CREDITO');
  protected readonly returnReason = signal('');
  protected readonly returnQuote = signal<ReturnQuoteResponse | null>(null);
  protected readonly loadingReturnQuote = signal(false);
  protected readonly submittingReturn = signal(false);
  protected readonly lastProcessedReturn = signal<GarmentReturn | null>(null);
  protected readonly showReturnReceiptModal = signal(false);

  constructor() {
    void this.searchProducts();
    this.refreshOutbox();
  }

  protected toggleSimulatedOffline(): void {
    this.simulatedOffline.update((v) => !v);
    if (this.simulatedOffline()) {
      toast.info('Simulación de Modo Offline Activada: Conexión forzada a almacenamiento local.');
    } else {
      toast.success('Simulación de Modo Offline Desactivada: Conexión normal restaurada.');
    }
  }

  protected setExactCash(): void {
    this.cashReceived.set(Number(this.total()));
  }

  protected addCash(amount: number): void {
    const current = this.cashReceived() ?? 0;
    this.cashReceived.set(current + amount);
  }

  protected async searchProducts(): Promise<void> {
    const branchId = this.branchId();
    this.loadingProducts.set(true);
    try {
      const response = await firstValueFrom(
        this.catalogApi.listProducts({ q: this.searchTerm() || undefined, branch_id: branchId ?? undefined })
      );
      this.products.set((response.data ?? []) as CatalogProduct[]);
    } catch (error) {
      toast.error(getErrorMessage(error, 'No se pudieron cargar los productos.'));
      this.products.set([]);
    } finally {
      this.loadingProducts.set(false);
    }
  }

  protected addVariant(product: CatalogProduct, variant: CatalogProductVariant): void {
    const items = [...this.selectedItems()];
    const existing = items.find((item) => item.variant_id === variant.id);
    if (existing) {
      existing.quantity += 1;
      this.selectedItems.set(items);
      return;
    }
    const finalPrice = product.has_discount ? product.discounted_price ?? variant.price : variant.price;
    items.push({
      variant_id: variant.id,
      product_name: product.name,
      variant_sku: variant.sku,
      size_name: variant.size_name ?? null,
      color_name: variant.color_name ?? null,
      unit_price: String(finalPrice),
      original_unit_price: String(variant.price),
      quantity: 1,
      image_url: variant.image_url || product.image_url || null,
    });
    this.selectedItems.set(items);
  }

  protected removeItem(variantId: string): void {
    this.selectedItems.update((items) => items.filter((item) => item.variant_id !== variantId));
  }

  protected decreaseItem(variantId: string): void {
    const items = [...this.selectedItems()];
    const index = items.findIndex((item) => item.variant_id === variantId);
    if (index >= 0) {
      if (items[index].quantity > 1) {
        items[index].quantity -= 1;
        this.selectedItems.set(items);
      } else {
        this.removeItem(variantId);
      }
    }
  }

  protected increaseItem(variantId: string): void {
    const items = [...this.selectedItems()];
    const index = items.findIndex((item) => item.variant_id === variantId);
    if (index >= 0) {
      items[index].quantity += 1;
      this.selectedItems.set(items);
    }
  }

  protected updateQuantity(index: number, quantity: number): void {
    const items = [...this.selectedItems()];
    if (quantity <= 0) {
      items.splice(index, 1);
    } else {
      items[index].quantity = quantity;
    }
    this.selectedItems.set(items);
  }

  protected clearSale(): void {
    this.selectedItems.set([]);
    this.cashReference.set('');
    this.cashReceived.set(null);
  }

  protected async submitSale(): Promise<void> {
    const branchId = this.branchId();
    if (!branchId) {
      toast.error('No se identificó la sucursal del cajero.');
      return;
    }

    if (this.selectedItems().length === 0) {
      toast.error('Debes seleccionar al menos un producto.');
      return;
    }

    const received = this.cashReceived();
    const tot = Number(this.total());
    if (received !== null && received < tot) {
      toast.error(`Monto recibido insuficiente. Faltan Bs ${(tot - received).toFixed(2)}`);
      return;
    }

    this.submitting.set(true);

    if (this.isOfflineEffective()) {
      try {
        const clientSaleId = crypto.randomUUID();
        const shortCode = clientSaleId.slice(0, 8).toUpperCase();
        const pendingSale: PendingOfflineSale = {
          client_sale_id: clientSaleId,
          sale_code: `TCK-OFF-${shortCode}`,
          branch_id: branchId,
          branch_name: this.branchName(),
          cashier_id: this.session.user()?.id ?? 'offline-user',
          cashier_name: this.cashierName(),
          payment_method: 'cash',
          cash_received: received ?? Number(this.total()),
          change_amount: Number(this.changeAmount()),
          subtotal: Number(this.subtotal()),
          discount_amount: Number(this.discount()),
          total_amount: Number(this.total()),
          currency: 'BOB',
          created_at: new Date().toISOString(),
          synced: false,
          items: this.selectedItems().map((item) => ({
            variant_id: item.variant_id,
            product_name: item.product_name,
            variant_sku: item.variant_sku,
            size_name: item.size_name,
            color_name: item.color_name,
            unit_price: Number(item.unit_price),
            quantity: item.quantity,
            line_total: Number(item.unit_price) * item.quantity,
          })),
        };

        this.idbSales.savePending(pendingSale);
        this.refreshOutbox();

        this.lastOfflineSale.set(pendingSale);
        this.lastSale.set(null);
        this.showReceiptModal.set(true);

        toast.success(`Venta de contingencia guardada localmente (Ticket #${shortCode}).`);
        this.selectedItems.set([]);
        this.cashReference.set('');
        this.cashReceived.set(null);
      } catch {
        toast.error('Error al guardar la venta de contingencia en almacenamiento local.');
      } finally {
        this.submitting.set(false);
      }
      return;
    }

    try {
      const clientSaleId = crypto.randomUUID();
      const payload: CreateSaleRequest = {
        branch_id: branchId,
        payment_method: 'cash',
        cash_reference: this.cashReference() || (received ? `Efectivo Bs ${received} - Vuelto Bs ${this.changeAmount()}` : null),
        client_sale_id: clientSaleId,
        is_offline: false,
        items: this.selectedItems().map((item) => ({ variant_id: item.variant_id, quantity: item.quantity })),
      };

      const response = await requestWithToast(this.salesApi.createSale(payload), {
        loading: 'Registrando venta en caja...',
        success: 'Venta registrada exitosamente.',
        error: 'No se pudo registrar la venta en servidor.',
      });

      this.lastSale.set(response.data ?? null);
      this.lastOfflineSale.set(null);
      this.showReceiptModal.set(true);

      this.selectedItems.set([]);
      this.cashReference.set('');
      this.cashReceived.set(null);
      await this.searchProducts();
    } catch {
      // Toast gestionado por requestWithToast
    } finally {
      this.submitting.set(false);
    }
  }

  protected closeReceiptModal(): void {
    this.showReceiptModal.set(false);
  }

  protected printReceipt(): void {
    window.print();
  }

  protected lineTotal(item: SelectedSaleItem): string {
    return (Number(item.unit_price) * item.quantity).toFixed(2);
  }

  // =========================================================================
  // LOGICA DEL CU18: Métodos de Devolución de Prenda
  // =========================================================================
  protected openReturnModal(): void {
    this.returnSaleIdInput.set('');
    this.foundSaleForReturn.set(null);
    this.selectedReturnVariantId.set(null);
    this.returnQuote.set(null);
    this.returnReason.set('');
    this.returnCondition.set('good_with_tags');
    this.refundMethod.set('NOTA_CREDITO');
    this.showReturnModal.set(true);
  }

  protected closeReturnModal(): void {
    this.showReturnModal.set(false);
  }

  protected async lookupSaleForReturn(): Promise<void> {
    const saleId = this.returnSaleIdInput().trim();
    if (!saleId) {
      toast.error('Ingresa el identificador o ticket de la venta.');
      return;
    }

    this.loadingSaleLookup.set(true);
    try {
      const resp = await firstValueFrom(this.salesApi.getSale(saleId, this.branchId() ?? undefined));
      this.foundSaleForReturn.set(resp.data ?? null);
      this.selectedReturnVariantId.set(null);
      this.returnQuote.set(null);
      toast.success('Venta localizada correctamente.');
    } catch (error) {
      toast.error(getErrorMessage(error, 'No se encontró la venta especificada en esta sucursal.'));
      this.foundSaleForReturn.set(null);
    } finally {
      this.loadingSaleLookup.set(false);
    }
  }

  protected async onSelectReturnVariant(variantId: string): Promise<void> {
    this.selectedReturnVariantId.set(variantId);
    const sale = this.foundSaleForReturn();
    if (!sale) return;

    this.loadingReturnQuote.set(true);
    try {
      const resp = await firstValueFrom(
        this.salesApi.quoteReturn({ sale_id: sale.id, variant_id: variantId }, this.branchId() ?? undefined)
      );
      this.returnQuote.set(resp.data ?? null);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Error al cotizar la retención de la prenda.'));
      this.returnQuote.set(null);
    } finally {
      this.loadingReturnQuote.set(false);
    }
  }

  protected async processReturnSubmit(): Promise<void> {
    const sale = this.foundSaleForReturn();
    const variantId = this.selectedReturnVariantId();
    if (!sale || !variantId) {
      toast.error('Selecciona la prenda que el cliente desea devolver.');
      return;
    }

    if (this.returnCondition() !== 'good_with_tags') {
      toast.error('Política 2: La prenda debe contar con su etiqueta textil intacta para aceptar la devolución.');
      return;
    }

    this.submittingReturn.set(true);
    try {
      const resp = await firstValueFrom(
        this.salesApi.processReturn(
          {
            sale_id: sale.id,
            variant_id: variantId,
            condition: this.returnCondition(),
            refund_method: this.refundMethod(),
            reason: this.returnReason().trim() || undefined,
          },
          this.branchId() ?? undefined
        )
      );

      this.lastProcessedReturn.set(resp.data ?? null);
      this.showReturnModal.set(false);
      this.showReturnReceiptModal.set(true);
      toast.success('Devolución procesada y confirmada.');
      await this.searchProducts();
    } catch (error) {
      toast.error(getErrorMessage(error, 'No se pudo procesar la devolución.'));
    } finally {
      this.submittingReturn.set(false);
    }
  }

  protected closeReturnReceiptModal(): void {
    this.showReturnReceiptModal.set(false);
  }
}
