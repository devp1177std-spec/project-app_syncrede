import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthService } from '../../auth/auth.service';

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    try {
      const session = await this.authService.auth.api.getSession({
        headers: request.headers,
      });

      if (session && session.user) {
        request.user = session.user;
        request.session = session.session;
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
