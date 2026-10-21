import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthService } from '../../auth/auth.service';

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    try {
      const result = await this.authService.validateRequest(request);
      if (result && result.user) {
        request.user = result.user;
        request.session = result.session;
      } else {
        request.user = null;
        request.session = null;
      }
    } catch {
      request.user = null;
      request.session = null;
    }
    return true;
  }
}
