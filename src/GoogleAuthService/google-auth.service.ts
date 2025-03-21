/* eslint-disable @typescript-eslint/no-unsafe-call */
import { BadRequestException, Injectable } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';

Injectable();
export class GoogleAuthService {
  private oauth2Client: OAuth2Client;
  private readonly clientId =
    '1023115981397-7dslsk33cqh94vigs8hnglafthgmoga1.apps.googleusercontent.com';
  private readonly clientSecret = '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';
  private readonly redirectUri = 'http://localhost:3000/auth/callback';

  constructor() {
    this.oauth2Client = new OAuth2Client(
      this.clientId,
      this.clientSecret,
      this.redirectUri,
    );
  }

  getAuthUrl(nonce: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ];
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      nonce: nonce,
    });
  }

  async getToken(code: string): Promise<any> {
    if (!code) {
      throw new BadRequestException('Authorization code is required');
    }

    try {
      // Exchange code for tokens
      const { tokens } = await this.oauth2Client.getToken(code);

      return tokens; // Return full token response
    } catch (error) {
      throw new BadRequestException(`${error} Failed to retrieve tokens`);
    }
  }
}
