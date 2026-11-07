import type { IUserRepository } from '../../../use-cases/ports/user.repository.port.js';
import { User } from '../../../domain/entities/user.entity.js';
import { KazakhstanPhoneNumber } from '../../../domain/value-objects/phone-number.vo.js';

export class InMemoryUserRepository implements IUserRepository {
  private readonly users: Map<string, User>;

  constructor() {
    this.users = new Map<string, User>();

    // Seed default test users
    const alicePhone = new KazakhstanPhoneNumber('+77011234567');
    const alice = new User('usr-alice', alicePhone, 'alice@example.kz', 'Алиса Сапарова', 'ru', ['customer']);
    this.users.set(alice.id, alice);

    const bobPhone = new KazakhstanPhoneNumber('+77029876543');
    const bob = new User('usr-bob', bobPhone, 'bob@example.kz', 'Боб Сериков', 'ru', ['customer']);
    this.users.set(bob.id, bob);

    const megaManager = new User('usr-mgr-mega', null, 'mega.manager@india-trikotaj.kz', 'Менеджер MEGA', 'ru', ['store_manager'], 'store-almaty-001');
    this.users.set(megaManager.id, megaManager);

    const dostykManager = new User('usr-mgr-dostyk', null, 'dostyk.manager@india-trikotaj.kz', 'Менеджер Dostyk', 'ru', ['store_manager'], 'store-almaty-002');
    this.users.set(dostykManager.id, dostykManager);

    const admin = new User('usr-admin-root', null, 'root.admin@india-trikotaj.kz', 'Главный Администратор', 'ru', ['admin']);
    this.users.set(admin.id, admin);
  }

  public async findById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  public async findByPhone(phone: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.phone && user.phone.toE164() === phone) return user;
    }
    return null;
  }

  public async findByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) return user;
    }
    return null;
  }

  public async save(user: User): Promise<User> {
    this.users.set(user.id, user);
    return user;
  }
}
