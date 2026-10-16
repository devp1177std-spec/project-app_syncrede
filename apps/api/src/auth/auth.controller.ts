import { Controller, All, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { toNodeHandler } from 'better-auth/node';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @All('/*')
  handler(@Req() req: Request, @Res() res: Response) {
    return toNodeHandler(this.authService.auth.handler)(req, res);
  }
}
