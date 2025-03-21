/* eslint-disable @typescript-eslint/no-unsafe-return */

import { Controller, Get, Query, Redirect } from '@nestjs/common';
import { GoogleAuthService } from './google-auth.service';

@Controller('auth')
export class GoogleAuthController {
  constructor(private readonly googleAuthService: GoogleAuthService) {}

  @Get()
  @Redirect()
  authRedirect(@Query('nonce') nonce: string) {
    return { url: this.googleAuthService.getAuthUrl(nonce) };
  }

  @Get('callback')
  async authCallback(@Query('code') code: string) {
    return this.googleAuthService.getToken(code);
  }
}
