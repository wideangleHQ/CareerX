import { Module } from '@nestjs/common';
import { PerformxModule } from '../../integrations/performx/performx.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { RedisModule } from '../../redis/redis.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SSOExchangeService } from './sso-exchange.service';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [PrismaModule, RedisModule, PerformxModule],
  controllers: [AuthController],
  providers: [AuthService, SSOExchangeService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
