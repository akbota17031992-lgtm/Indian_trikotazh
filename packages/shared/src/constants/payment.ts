export const KASPI_PAY_CONSTANTS = {
  QR_EXPIRY_SECONDS: 300, // 5 minutes validity
  MAX_PUSH_DESCRIPTION_LENGTH: 60,
  MAX_QR_DESCRIPTION_LENGTH: 100,
  SUPPORTED_MODES: ['KaspiGold', 'KaspiRed', 'KaspiKredit', 'QR'] as const,
  WEBHOOK_EVENTS: {
    STATUS_CHANGED: 'invoice.status_changed',
    QR_SCANNED: 'invoice.qr_scanned',
    REFUNDED: 'invoice.refunded',
  } as const,
};
