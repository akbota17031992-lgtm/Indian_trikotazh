import { Result, ok, err } from '../../domain/types/result.js';
import { UnauthorizedError, NotFoundError } from '../../domain/errors/domain-errors.js';
import { User, UserRole } from '../../domain/entities/user.entity.js';
import { KazakhstanPhoneNumber } from '../../domain/value-objects/phone-number.vo.js';
import type { IUserRepository } from '../ports/user.repository.port.js';

export interface AuthSessionPayload {
  sub: string;
  phone?: string;
  email?: string;
  roles?: UserRole[];
  user_metadata?: {
    full_name?: string;
    language_preference?: 'ru' | 'kz';
  };
}

export class AuthUseCase {
  private readonly userRepo: IUserRepository;

  constructor(userRepo: IUserRepository) {
    this.userRepo = userRepo;
  }

  async getSessionUser(payload: AuthSessionPayload): Promise<Result<User, UnauthorizedError>> {
    if (!payload || !payload.sub) {
      return err(new UnauthorizedError('Missing or invalid session'));
    }

    let user = await this.userRepo.findById(payload.sub);
    if (!user) {
      const phoneVO = payload.phone && KazakhstanPhoneNumber.isValid(payload.phone)
        ? KazakhstanPhoneNumber.from(payload.phone)
        : null;

      user = new User(
        payload.sub,
        phoneVO,
        payload.email || null,
        payload.user_metadata?.full_name || '',
        payload.user_metadata?.language_preference || 'ru',
        payload.roles || ['customer']
      );
      await this.userRepo.save(user);
    }

    return ok(user);
  }

  async getProfile(userId: string): Promise<Result<User, NotFoundError>> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      return err(NotFoundError.user(userId));
    }
    return ok(user);
  }
}
