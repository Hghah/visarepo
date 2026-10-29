import { Global, Inject, Injectable, Module, type OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env.js';
import { createDatabase, type DatabaseHandle } from './database.js';

export const DB = Symbol('DB');
const HANDLE = Symbol('DB_HANDLE');

@Injectable()
class PoolCloser implements OnApplicationShutdown {
  constructor(@Inject(HANDLE) private readonly handle: DatabaseHandle) {}
  async onApplicationShutdown(): Promise<void> {
    await this.handle.pool.end();
  }
}

@Global()
@Module({
  providers: [
    {
      provide: HANDLE,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) =>
        createDatabase(config.get('DATABASE_URL', { infer: true }), config.get('DATABASE_POOL_MAX', { infer: true })),
    },
    { provide: DB, inject: [HANDLE], useFactory: (h: DatabaseHandle) => h.db },
    PoolCloser,
  ],
  exports: [DB],
})
export class DatabaseModule {}
