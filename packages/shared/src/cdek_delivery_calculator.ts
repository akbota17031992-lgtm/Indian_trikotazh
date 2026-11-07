/**
 * Индийский Трикотаж — Калькулятор сроков и стоимости доставки (СДЭК / Казпочта / Яндекс.Доставка)
 */

export interface DeliveryOption {
  carrier: 'cdek' | 'kazpost' | 'yandex_express';
  name: string;
  tariff: string;
  priceKzt: number;
  deliveryDaysMin: number;
  deliveryDaysMax: number;
  isFree: boolean;
}

export interface DeliveryCalculationParams {
  destinationCity: string;
  weightGrams?: number;
  orderTotalKzt: number;
}

export class DeliveryCalculator {
  private static FREE_DELIVERY_THRESHOLD = 25000; // Бесплатная доставка от 25 000 ₸

  /**
   * Расчет вариантов доставки по Казахстану
   */
  public static calculateOptions(params: DeliveryCalculationParams): DeliveryOption[] {
    const isAlmaty = params.destinationCity.trim().toLowerCase().includes('алматы');
    const isFree = params.orderTotalKzt >= this.FREE_DELIVERY_THRESHOLD;

    const options: DeliveryOption[] = [];

    if (isAlmaty) {
      // 1. Яндекс Доставка день в день по Алматы
      options.push({
        carrier: 'yandex_express',
        name: 'Яндекс Экспресс (по Алматы)',
        tariff: 'В день заказа (2–3 часа)',
        priceKzt: isFree ? 0 : 1800,
        deliveryDaysMin: 0,
        deliveryDaysMax: 0,
        isFree
      });

      // 2. Курьер СДЭК до двери
      options.push({
        carrier: 'cdek',
        name: 'СДЭК Курьер до двери',
        tariff: 'На следующий день',
        priceKzt: isFree ? 0 : 1200,
        deliveryDaysMin: 1,
        deliveryDaysMax: 1,
        isFree
      });
    } else {
      // Регионы Казахстана (Астана, Шымкент, Караганда и др.)
      options.push({
        carrier: 'cdek',
        name: 'СДЭК Экспресс (до двери)',
        tariff: 'Магистральный экспресс',
        priceKzt: isFree ? 0 : 2500,
        deliveryDaysMin: 2,
        deliveryDaysMax: 4,
        isFree
      });

      options.push({
        carrier: 'cdek',
        name: 'СДЭК Постамат / Пункт выдачи',
        tariff: 'Эконом до ПВЗ',
        priceKzt: isFree ? 0 : 1600,
        deliveryDaysMin: 3,
        deliveryDaysMax: 5,
        isFree
      });

      options.push({
        carrier: 'kazpost',
        name: 'Казпочта EMS',
        tariff: 'Почтовое отделение',
        priceKzt: isFree ? 0 : 1400,
        deliveryDaysMin: 4,
        deliveryDaysMax: 7,
        isFree
      });
    }

    return options;
  }
}

