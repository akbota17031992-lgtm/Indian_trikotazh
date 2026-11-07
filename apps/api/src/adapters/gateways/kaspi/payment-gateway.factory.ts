import type { IPaymentGateway } from '../../../use-cases/ports/payment-gateway.port.js';
import { MockKaspiPaymentAdapter } from './mock-kaspi-payment.adapter.js';
import { ApiPayKzPaymentAdapter, type ApiPayConfig } from './apipay-kz-payment.adapter.js';

export interface PaymentGatewayFactoryOptions {
  mock?: boolean;
  webhookSecret?: string;
  apiConfig?: ApiPayConfig;
}

export class PaymentGatewayFactory {
  public static create(options?: PaymentGatewayFactoryOptions): IPaymentGateway {
    const isMockForced = options?.mock !== undefined
      ? options.mock
      : (process.env.KASPI_MOCK_MODE === 'true' || !process.env.APIPAY_API_KEY);

    if (isMockForced) {
      return new MockKaspiPaymentAdapter(options?.webhookSecret);
    }

    return new ApiPayKzPaymentAdapter({
      webhookSecret: options?.webhookSecret,
      ...options?.apiConfig,
    });
  }
}
