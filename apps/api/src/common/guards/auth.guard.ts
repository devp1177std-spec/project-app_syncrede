import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../auth/auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const result = await this.authService.validateRequest(request);

    if (!result || !result.user) {
      throw new UnauthorizedException('Authentication required');
    }

    request.user = result.user;
    request.session = result.session;
    return true;
  }
}
