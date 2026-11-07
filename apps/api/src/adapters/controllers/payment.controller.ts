import type { Request, Response, NextFunction } from 'express';
import type { IOrderRepository } from '../../use-cases/ports/order.repository.port.js';
import { CreateKaspiInvoiceUseCase } from '../../use-cases/payments/create-kaspi-invoice.use-case.js';
import { ProcessKaspiWebhookUseCase } from '../../use-cases/payments/process-kaspi-webhook.use-case.js';
import { PaymentGatewayFactory } from '../gateways/kaspi/payment-gateway.factory.js';

export class PaymentController {
  private readonly createInvoiceUseCase: CreateKaspiInvoiceUseCase;
  private readonly processWebhookUseCase: ProcessKaspiWebhookUseCase;

  constructor(
    createInvoiceUseCaseOrOrderRepo: CreateKaspiInvoiceUseCase | IOrderRepository,
    processWebhookUseCaseOrSecret?: ProcessKaspiWebhookUseCase | string
  ) {
    if (
      createInvoiceUseCaseOrOrderRepo &&
      'execute' in createInvoiceUseCaseOrOrderRepo &&
      typeof (createInvoiceUseCaseOrOrderRepo as any).execute === 'function'
    ) {
      this.createInvoiceUseCase = createInvoiceUseCaseOrOrderRepo as CreateKaspiInvoiceUseCase;
      this.processWebhookUseCase = processWebhookUseCaseOrSecret as ProcessKaspiWebhookUseCase;
    } else {
      // Backward compatibility constructor for direct orderRepo instantiation
      const orderRepo = createInvoiceUseCaseOrOrderRepo as IOrderRepository;
      const secret =
        typeof processWebhookUseCaseOrSecret === 'string'
          ? processWebhookUseCaseOrSecret
          : process.env.KASPI_WEBHOOK_SECRET || 'test_kaspi_webhook_secret_key_12345';
      const gateway = PaymentGatewayFactory.create({ webhookSecret: secret });
      const dummyInventoryRepo: any = {
        commitStockDeduction: async () => true,
        releaseStock: async () => true,
        reserveStock: async () => true,
      };
      this.createInvoiceUseCase = new CreateKaspiInvoiceUseCase(gateway, orderRepo);
      this.processWebhookUseCase = new ProcessKaspiWebhookUseCase(gateway, orderRepo, dummyInventoryRepo);
    }
  }

  public createKaspiInvoice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.createInvoiceUseCase.execute(req.body || {});
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  };

  public handleKaspiWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rawBody = (req as any).rawBody || (req.body ? Buffer.from(JSON.stringify(req.body)) : undefined);
      const signatureHeader = req.headers['x-webhook-signature'];

      const result = await this.processWebhookUseCase.execute({
        rawBody,
        signatureHeader,
        payload: req.body,
      });

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };
}
