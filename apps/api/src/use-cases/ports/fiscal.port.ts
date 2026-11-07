export interface FiscalItem {
  name: string;
  count: number;
  priceKzt: number;
  totalKzt: number;
  sectionCode?: string;
  taxPercent?: number;
}

export interface FiscalReceiptParams {
  orderId: string;
  amountKzt: number;
  customerPhone?: string;
  customerEmail?: string;
  paymentType: 'CASHLESS' | 'KASPI_PAY' | 'CARD';
  items: FiscalItem[];
}

export interface FiscalReceiptResult {
  success: boolean;
  ticketNumber: string;
  fiscalSign: string;
  registrationNumber: string;
  qrCodeUrl: string;
  printedAt: string;
  rawResponse?: Record<string, unknown>;
}

export interface IFiscalGateway {
  registerReceipt(params: FiscalReceiptParams): Promise<FiscalReceiptResult>;
}

