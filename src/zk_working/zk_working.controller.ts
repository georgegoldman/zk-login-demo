/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/require-await */
import {
  Controller,
  Get,
  UnauthorizedException,
  Headers,
} from '@nestjs/common';
import { ZkWorkingService } from './zk_working.service';

@Controller('zk-working')
export class ZkWorkingController {
  constructor(private zkWorkingService: ZkWorkingService) {
    this.zkWorkingService = new ZkWorkingService();
  }

  @Get()
  async readNonce(): Promise<{ nonce: string }> {
    const nonce = this.zkWorkingService.getNonce();
    return { nonce };
  }

  @Get('jwt-to-address')
  async getUserAddress() {
    return this.zkWorkingService.getUserAddress();
  }

  @Get('get-zk-proof')
  async getZkProof() {
    return this.zkWorkingService.getZkProof();
  }

  @Get('sign-transaction')
  async signTransaction(@Headers('authorization') authHeader: string) {
    const token = authHeader?.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }
    return await this.zkWorkingService.signTransaction(token);
  }
}
