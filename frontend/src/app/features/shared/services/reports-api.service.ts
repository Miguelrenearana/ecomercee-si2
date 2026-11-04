import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../../../core/services/api.service';
import {
  InventoryReportResponse,
  MovementsReportResponse,
  NaturalReportResponse,
  ReportExportFormat,
  ReportQuery,
  SalesReportResponse,
  ReportType,
} from '../models/report.model';

@Injectable({ providedIn: 'root' })
export class ReportsApiService {
  private readonly api = inject(ApiService);

  getSalesReport(filters: ReportQuery) {
    return this.api.get<SalesReportResponse>(`/reports/sales${this.query(filters)}`);
  }

  getInventoryReport(filters: ReportQuery) {
    return this.api.get<InventoryReportResponse>(`/reports/inventory${this.query(filters)}`);
  }

  getMovementsReport(filters: ReportQuery) {
    return this.api.get<MovementsReportResponse>(`/reports/movements${this.query(filters)}`);
  }

  queryNaturalLanguage(query: string) {
    return this.api.post<NaturalReportResponse>('/reports/query', { query });
  }

  exportReport(type: ReportType, format: ReportExportFormat, filters: ReportQuery, columns?: string[]): Observable<Blob> {
    const params = new URLSearchParams();
    params.set('format', format);
    if (columns && columns.length > 0) {
      params.set('columns', columns.join(','));
    }
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    return this.api.get<Blob>(`/reports/${type}/export?${params.toString()}`, { responseType: 'blob' as const });
  }

  downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  private query(filters: ReportQuery): string {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    const query = params.toString();
    return query ? `?${query}` : '';
  }
}
