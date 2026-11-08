export interface ProductColor {
  id: string;
  nameRu: string;
  nameKz: string;
  hex: string;
}

export interface MobileProduct {
  id: string;
  slug: string;
  titleRu: string;
  titleKz: string;
  priceKzt: number;
  oldPriceKzt?: number;
  imageUrl: string;
  images: string[];
  category: string;
  compositionRu: string;
  compositionKz: string;
  descriptionRu: string;
  descriptionKz: string;
  colors: ProductColor[];
  sizes: string[];
  stockByStore: Record<string, number>;
  isBestseller?: boolean;
  isNew?: boolean;
}

export interface CartItem {
  product: MobileProduct;
  quantity: number;
  size: string;
  color: ProductColor;
}

export type TabType = 'home' | 'catalog' | 'stores' | 'cart' | 'profile';

export type FulfillmentType = 'pickup' | 'courier';

export interface MobileOrder {
  id: string;
  createdAt: string;
  items: CartItem[];
  totalKzt: number;
  fulfillmentType: FulfillmentType;
  pickupStoreId?: string;
  courierAddress?: {
    district: string;
    street: string;
    building: string;
    apartment?: string;
  };
  customerName: string;
  customerPhone: string;
  paymentMethod: 'kaspi_pay' | 'cash_on_delivery';
  status: 'new' | 'processing' | 'ready_for_pickup' | 'in_delivery' | 'completed';
}

export interface UserProfile {
  name: string;
  phone: string;
  email?: string;
  bonusPoints: number;
  isRegistered: boolean;
  pinCode?: string;
  patternCode?: string;
  biometricsEnabled?: boolean;
  preferredUnlockMode?: 'pin' | 'pattern';
}
