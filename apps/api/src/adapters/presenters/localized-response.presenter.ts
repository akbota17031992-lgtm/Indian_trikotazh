import type { Request } from 'express';

export class LocalizedResponsePresenter {
  public static extractLocale(req: Request): 'ru' | 'kz' {
    if (req.query.lang === 'kz' || req.query.lang === 'kk') return 'kz';
    if (req.query.lang === 'ru') return 'ru';
    const acceptLang = req.headers['accept-language'];
    if (acceptLang && (acceptLang.includes('kz') || acceptLang.includes('kk'))) {
      return 'kz';
    }
    return 'ru';
  }

  public static formatStore(store: any): any {
    const rawCoords = store.coordinates;
    const lat = typeof store.latitude === 'number'
      ? store.latitude
      : (rawCoords?.latitude ?? (rawCoords?.lat ?? 43.238949));
    const lng = typeof store.longitude === 'number'
      ? store.longitude
      : (rawCoords?.longitude ?? (rawCoords?.lng ?? 76.889709));

    const phoneStr = typeof store.phone === 'object' && store.phone !== null && 'format' in store.phone
      ? store.phone.format()
      : String(store.phone || '');

    const scheduleRu = store.schedule?.displayTextRu || store.openHoursRu || store.schedule_ru || 'Ежедневно с 10:00 до 22:00';
    const scheduleKz = store.schedule?.displayTextKz || store.openHoursKz || store.schedule_kz || 'Күн сайын 10:00-ден 22:00-ге дейін';

    return {
      id: store.id,
      slug: store.slug,
      nameRu: store.nameRu || store.name_ru,
      nameKz: store.nameKz || store.name_kz,
      name_ru: store.nameRu || store.name_ru,
      name_kz: store.nameKz || store.name_kz,
      districtRu: store.districtRu || store.district || 'Бостандыкский',
      districtKz: store.districtKz || store.district || 'Бостандық',
      district: store.districtRu || store.district || 'Бостандыкский',
      addressRu: store.addressRu || store.address_ru,
      addressKz: store.addressKz || store.address_kz,
      address_ru: store.addressRu || store.address_ru,
      address_kz: store.addressKz || store.address_kz,
      latitude: lat,
      longitude: lng,
      coordinates: { lat, lng, latitude: lat, longitude: lng },
      phone: phoneStr,
      email: store.email || null,
      openHoursRu: scheduleRu,
      openHoursKz: scheduleKz,
      schedule_ru: scheduleRu,
      schedule_kz: scheduleKz,
      schedule: store.schedule,
      imageUrl: store.imageUrl || null,
      features: store.features || {
        hasFittingRooms: true,
        hasParking: true,
        acceptsKaspiQr: true,
        hasWheelchairAccess: false
      },
      isActive: store.isActive !== undefined ? Boolean(store.isActive) : Boolean(store.is_active),
      is_active: store.isActive !== undefined ? Boolean(store.isActive) : Boolean(store.is_active),
      createdAt: store.createdAt || new Date(),
      updatedAt: store.updatedAt || new Date()
    };
  }

  public static formatProduct(product: any): any {
    const basePrice = typeof product.basePrice === 'object' && product.basePrice !== null && 'amountKzt' in product.basePrice
      ? product.basePrice.amountKzt
      : (product.basePriceKzt ?? product.base_price_kzt ?? 0);

    const titleRu = product.nameRu || product.titleRu || product.name_ru || '';
    const titleKz = product.nameKz || product.titleKz || product.name_kz || '';

    const formattedVariants = (product.variants || []).map((v: any) => LocalizedResponsePresenter.formatVariant(v));

    return {
      id: product.id,
      categoryId: product.categoryId || product.category_id,
      category_id: product.categoryId || product.category_id,
      slug: product.slug,
      nameRu: titleRu,
      nameKz: titleKz,
      name_ru: titleRu,
      name_kz: titleKz,
      titleRu,
      titleKz,
      title_ru: titleRu,
      title_kz: titleKz,
      descriptionRu: product.descriptionRu || product.description_ru,
      descriptionKz: product.descriptionKz || product.description_kz,
      description_ru: product.descriptionRu || product.description_ru,
      description_kz: product.descriptionKz || product.description_kz,
      materialRu: product.materialRu || product.material_ru,
      materialKz: product.materialKz || product.material_kz,
      material_ru: product.materialRu || product.material_ru,
      material_kz: product.materialKz || product.material_kz,
      season: product.season,
      gender: product.gender,
      tags: product.tags || [],
      status: product.status || 'active',
      isPublished: product.isPublished !== undefined ? Boolean(product.isPublished) : true,
      is_published: product.isPublished !== undefined ? Boolean(product.isPublished) : true,
      isFeatured: Boolean(product.isFeatured || product.is_featured),
      is_featured: Boolean(product.isFeatured || product.is_featured),
      basePriceKzt: basePrice,
      base_price_kzt: basePrice,
      countryOfOriginRu: product.countryOfOriginRu || 'Индия',
      countryOfOriginKz: product.countryOfOriginKz || 'Үндістан',
      variants: formattedVariants,
      images: product.images || [],
      averageRating: product.averageRating || 5.0,
      reviewsCount: product.reviewsCount || 0,
      metadata: product.metadata || {},
      createdAt: product.createdAt || new Date(),
      updatedAt: product.updatedAt || new Date()
    };
  }

  public static formatVariant(variant: any): any {
    const price = typeof variant.price === 'object' && variant.price !== null && 'amountKzt' in variant.price
      ? variant.price.amountKzt
      : (variant.priceKzt ?? variant.price_kzt ?? 0);

    const skuVal = typeof variant.sku === 'object' && variant.sku !== null && 'value' in variant.sku
      ? variant.sku.value
      : String(variant.sku || '');

    return {
      id: variant.id,
      productId: variant.productId || variant.product_id,
      product_id: variant.productId || variant.product_id,
      sku: skuVal,
      barcode: variant.barcode || skuVal,
      size: variant.size,
      colorRu: variant.colorRu || variant.color_ru,
      colorKz: variant.colorKz || variant.color_kz,
      color_ru: variant.colorRu || variant.color_ru,
      color_kz: variant.colorKz || variant.color_kz,
      colorHex: variant.colorHex || variant.color_hex,
      color_hex: variant.colorHex || variant.color_hex,
      priceKzt: price,
      price_kzt: price,
      isActive: variant.isActive !== undefined ? Boolean(variant.isActive) : true,
      is_active: variant.isActive !== undefined ? Boolean(variant.isActive) : true,
      createdAt: variant.createdAt || new Date(),
      updatedAt: variant.updatedAt || new Date()
    };
  }

  public static formatOrder(order: any): any {
    const phoneStr = typeof order.customerPhone === 'object' && order.customerPhone !== null && 'format' in order.customerPhone
      ? order.customerPhone.format()
      : String(order.customerPhone || order.customer_phone || '');

    const subtotal = typeof order.subtotal === 'object' && order.subtotal !== null && 'amountKzt' in order.subtotal
      ? order.subtotal.amountKzt
      : (order.subtotalKzt ?? order.subtotal_kzt ?? 0);

    const deliveryFee = typeof order.deliveryFee === 'object' && order.deliveryFee !== null && 'amountKzt' in order.deliveryFee
      ? order.deliveryFee.amountKzt
      : (order.deliveryFeeKzt ?? order.delivery_fee_kzt ?? 0);

    const total = typeof order.total === 'object' && order.total !== null && 'amountKzt' in order.total
      ? order.total.amountKzt
      : (order.totalKzt ?? order.total_kzt ?? (subtotal + deliveryFee));

    const formattedItems = (order.items || []).map((item: any) => {
      const itemPrice = typeof item.unitPrice === 'object' && item.unitPrice !== null && 'amountKzt' in item.unitPrice
        ? item.unitPrice.amountKzt
        : (item.unitPriceKzt ?? item.unit_price_kzt ?? 0);
      const itemTotal = typeof item.totalPrice === 'object' && item.totalPrice !== null && 'amountKzt' in item.totalPrice
        ? item.totalPrice.amountKzt
        : (item.totalPriceKzt ?? item.total_price_kzt ?? (itemPrice * (item.quantity || 1)));

      return {
        id: item.id,
        orderId: item.orderId || item.order_id,
        variantId: item.variantId || item.variant_id,
        variant_id: item.variantId || item.variant_id,
        sku: item.productSnapshot?.sku || item.sku,
        productName: item.productSnapshot?.titleRu || item.product_name || 'Товар',
        product_name: item.productSnapshot?.titleRu || item.product_name || 'Товар',
        size: item.productSnapshot?.size || item.size,
        color: item.productSnapshot?.colorRu || item.color,
        quantity: item.quantity,
        unitPriceKzt: itemPrice,
        unit_price_kzt: itemPrice,
        totalPriceKzt: itemTotal,
        total_price_kzt: itemTotal
      };
    });

    return {
      id: order.id,
      orderNumber: order.orderNumber || order.order_number,
      order_number: order.orderNumber || order.order_number,
      userId: order.userId || order.user_id || null,
      user_id: order.userId || order.user_id || null,
      customerName: order.customerName || order.customer_name,
      customer_name: order.customerName || order.customer_name,
      customerPhone: phoneStr,
      customer_phone: phoneStr,
      customerEmail: order.customerEmail || order.customer_email || null,
      customer_email: order.customerEmail || order.customer_email || null,
      status: order.status,
      deliveryType: order.deliveryType || order.fulfillment_type || order.delivery_type,
      delivery_type: order.deliveryType || order.fulfillment_type || order.delivery_type,
      fulfillmentType: order.deliveryType || order.fulfillment_type || order.delivery_type,
      fulfillment_type: order.deliveryType || order.fulfillment_type || order.delivery_type,
      pickupStoreId: order.pickupStoreId || order.pickup_store_id || order.store_id || null,
      pickup_store_id: order.pickupStoreId || order.pickup_store_id || order.store_id || null,
      store_id: order.pickupStoreId || order.pickup_store_id || order.store_id || null,
      deliveryAddress: order.shippingAddress || order.deliveryAddress || order.delivery_address || null,
      delivery_address: order.shippingAddress || order.deliveryAddress || order.delivery_address || null,
      shipping_address: order.shippingAddress || order.deliveryAddress || order.delivery_address || null,
      items: formattedItems,
      subtotalKzt: subtotal,
      subtotal_kzt: subtotal,
      deliveryFeeKzt: deliveryFee,
      delivery_fee_kzt: deliveryFee,
      totalKzt: total,
      total_kzt: total,
      paymentMethod: order.paymentMethod || order.payment_method || 'kaspi_gold',
      payment_method: order.paymentMethod || order.payment_method || 'kaspi_gold',
      paymentStatus: order.paymentStatus || order.payment_status || 'pending',
      payment_status: order.paymentStatus || order.payment_status || 'pending',
      kaspiInvoiceId: order.kaspiInvoiceId || order.kaspi_invoice_id || null,
      kaspi_invoice_id: order.kaspiInvoiceId || order.kaspi_invoice_id || null,
      kaspiTransactionId: order.kaspiTransactionId || order.kaspi_transaction_id || null,
      kaspi_transaction_id: order.kaspiTransactionId || order.kaspi_transaction_id || null,
      createdAt: order.createdAt || new Date(),
      created_at: order.createdAt || new Date(),
      updatedAt: order.updatedAt || new Date(),
      updated_at: order.updatedAt || new Date()
    };
  }
}
