import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ZkWorkingController } from './zk_working/zk_working.controller';
import { ZkWorkingService } from './zk_working/zk_working.service';
import { GoogleAuthController } from './GoogleAuthService/google-auth.controller';
import { GoogleAuthService } from './GoogleAuthService/google-auth.service';

@Module({
  imports: [],
  controllers: [AppController, ZkWorkingController, GoogleAuthController],
  providers: [AppService, ZkWorkingService, GoogleAuthService],
})
export class AppModule {}
