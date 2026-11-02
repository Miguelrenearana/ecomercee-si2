import { ApiResponse } from '../../../core/models/api.model';
import { PaymentMethodEnum, PaymentStatusEnum } from './order.model';

export type SaleStatus = 'completed' | 'cancelled';
export type SaleType = 'venta presencial' | 'venta virtual';

export interface SaleItem {
  id: string;
  sale_id: string;
  variant_id: string;
  quantity: number;
  unit_price: string;
  original_unit_price: string | null;
  discount_amount: string;
  line_total: string;
  product_id: string;
  product_name: string;
  variant_sku: string;
  size_id: string | null;
  color_id: string | null;
  size_name: string | null;
  color_name: string | null;
  image_url: string | null;
  image_public_id: string | null;
}

export interface Sale {
  id: string;
  branch_id: string;
  branch_name: string;
  type: SaleType;
  user_id: string;
  reservation_id: string | null;
  client_sale_id?: string | null;
  is_offline?: boolean;
  synced_at?: string | null;
  status: SaleStatus;
  payment_method: PaymentMethodEnum;
  payment_status: PaymentStatusEnum;
  cash_reference: string | null;
  subtotal: string;
  discount_amount: string;
  total_amount: string;
  currency: string;
  created_at: string;
  updated_at: string | null;
  items: SaleItem[];
}

export interface CreateSaleItemRequest {
  variant_id: string;
  quantity: number;
}

export interface CreateSaleRequest {
  branch_id?: string | null;
  reservation_id?: string | null;
  payment_method: PaymentMethodEnum;
  cash_reference?: string | null;
  client_sale_id?: string | null;
  is_offline?: boolean;
  items: CreateSaleItemRequest[];
}

export type SaleResponse = ApiResponse<Sale>;
export type SalesListResponse = ApiResponse<Sale[]>;

// CU17: Modelos de Cambio de Prenda
export interface ExchangeQuoteResponse {
  sale_id: string;
  branch_id: string;
  original_variant_id: string;
  original_product_name: string;
  original_variant_sku: string;
  original_unit_price: number;
  new_variant_id: string;
  new_product_name: string;
  new_variant_sku: string;
  new_unit_price: number;
  price_difference: number;
  requires_payment: boolean;
  available_stock_new: number;
}

export interface GarmentExchange {
  id: string;
  tenant_id: string;
  branch_id: string;
  cashier_id: string;
  sale_id: string;
  original_variant_id: string;
  new_variant_id: string;
  price_difference: number;
  difference_paid: boolean;
  payment_method?: string | null;
  status: string;
  notes?: string | null;
  created_at: string;
}

// CU18: Modelos de Devolución de Prenda con Retención
export interface ReturnQuoteResponse {
  sale_id: string;
  branch_id: string;
  variant_id: string;
  product_name: string;
  variant_sku: string;
  original_item_amount: number;
  retention_percentage: number;
  retention_amount: number;
  refund_amount: number;
  max_return_days: number;
  days_elapsed: number;
  policy_tenant_name: string;
}

export interface GarmentReturn {
  id: string;
  tenant_id: string;
  branch_id: string;
  cashier_id: string;
  sale_id: string;
  variant_id: string;
  quantity: number;
  original_item_amount: number;
  retention_percentage: number;
  retention_amount: number;
  refund_amount: number;
  refund_method: string;
  credit_note_code?: string | null;
  reason?: string | null;
  created_at: string;
}

