import { KazakhstanPhoneNumber } from '../value-objects/phone-number.vo.js';

export type UserRole = 'customer' | 'staff' | 'store_manager' | 'manager' | 'admin';

export class User {
  readonly id: string;
  readonly phone: KazakhstanPhoneNumber | null;
  readonly email: string | null;
  fullName: string;
  languagePreference: 'ru' | 'kz';
  readonly roles: UserRole[];
  readonly storeId: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(
    id: string,
    phone: KazakhstanPhoneNumber | null,
    email: string | null,
    fullName: string,
    languagePreference: 'ru' | 'kz' = 'ru',
    roles: UserRole[] = ['customer'],
    storeId: string | null = null,
    createdAt: Date = new Date(),
    updatedAt: Date = new Date()
  ) {
    this.id = id;
    this.phone = phone;
    this.email = email;
    this.fullName = fullName;
    this.languagePreference = languagePreference;
    this.roles = roles;
    this.storeId = storeId;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  isAdmin(): boolean {
    return this.roles.includes('admin');
  }

  isStaff(): boolean {
    return this.roles.some(r => ['admin', 'staff', 'store_manager', 'manager'].includes(r));
  }

  canManageStore(storeId: string): boolean {
    if (this.isAdmin()) return true;
    return this.roles.includes('store_manager') && (this.storeId === null || this.storeId === storeId);
  }
}
