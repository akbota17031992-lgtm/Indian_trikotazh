import type { Request, Response, NextFunction } from 'express';
import { AuthUseCase } from '../../use-cases/auth/auth.use-case.js';
import type { IUserRepository } from '../../use-cases/ports/user.repository.port.js';
import { AppError } from '../../infrastructure/http/middlewares/error-handler.middleware.js';

export class AuthController {
  private readonly authUseCase: AuthUseCase;

  constructor(userRepo: IUserRepository) {
    this.authUseCase = new AuthUseCase(userRepo);
  }

  public getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authUser = (req as any).user;
      if (!authUser || !authUser.id) {
        throw new AppError(401, 'UNAUTHORIZED', 'Authentication token required');
      }

      const userProfile = {
        id: authUser.id,
        role: authUser.role,
        email: authUser.email || null,
        phone: authUser.phone || null,
        assignedStoreId: authUser.assignedStoreId || authUser.storeId || null,
      };

      res.status(200).json({
        user: userProfile,
        data: userProfile,
      });
    } catch (err) {
      next(err);
    }
  };
}
