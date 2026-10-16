import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../auth/auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const session = await this.authService.auth.api.getSession({
      headers: request.headers,
    });

    if (!session || !session.user) {
      throw new UnauthorizedException('Authentication required');
    }

    request.user = session.user;
    request.session = session.session;
    return true;
  }
}
