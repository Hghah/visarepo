import { type ExecutionContext, type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { CitiesModule } from './cities/cities.module.js';
import { isInternalRequest } from './common/internal-token.js';
import { RequestLoggerMiddleware } from './common/request-logger.middleware.js';
import { type Env, validateEnv } from './config/env.js';
import { CountriesModule } from './countries/countries.module.js';
import { DatabaseModule } from './database/database.module.js';
import { DestinationsModule } from './destinations/destinations.module.js';
import { EntriesModule } from './entries/entries.module.js';
import { HealthModule } from './health/health.module.js';
import { MobilityModule } from './mobility/mobility.module.js';
import { PassportsModule } from './passports/passports.module.js';

@Module({
  imports: [
    // Local development reads apps/api/.env, then the repo-root .env; real environment variables win.
    ConfigModule.forRoot({ isGlobal: true, cache: true, envFilePath: ['.env', '../../.env'], validate: validateEnv }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => {
        const token = config.get('INTERNAL_API_TOKEN', { infer: true });
        return {
          throttlers: [{ ttl: config.get('THROTTLE_TTL_MS', { infer: true }), limit: config.get('THROTTLE_LIMIT', { infer: true }) }],
          skipIf: (ctx: ExecutionContext) => isInternalRequest(ctx, token),
        };
      },
    }),
    DatabaseModule,
    HealthModule,
    CountriesModule,
    PassportsModule,
    EntriesModule,
    DestinationsModule,
    MobilityModule,
    CitiesModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*path');
  }
}
