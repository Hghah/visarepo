import { type INestApplication, Logger, type LogLevel, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import helmet from 'helmet';
import type { Env } from './config/env.js';
import { mountApiDocs } from './docs.js';

const LEVELS: LogLevel[] = ['error', 'warn', 'log', 'debug', 'verbose'];

/** Middleware, prefix, versioning, CORS and docs. Shared by main.ts and the e2e tests. */
export function configureApp(app: INestApplication): void {
  const config = app.get(ConfigService<Env, true>);
  const level = config.get('LOG_LEVEL', { infer: true });
  app.useLogger(LEVELS.slice(0, LEVELS.indexOf(level) + 1));

  const express = app as NestExpressApplication;
  express.set('trust proxy', 1);
  express.disable('x-powered-by');

  app.use(helmet());
  app.use(compression());
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: undefined });
  app.enableCors({
    origin: config
      .get('CORS_ORIGINS', { infer: true })
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
    methods: ['GET', 'HEAD', 'OPTIONS'],
    maxAge: 86_400,
  });
  app.enableShutdownHooks();

  if (config.get('SWAGGER_ENABLED', { infer: true })) {
    const doc = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('Stamped API')
        .setDescription('Entry rules for 199 passports and 199 destinations, with every way in, mobility scores and flight-search cities.')
        .setVersion('1.0')
        .build(),
    );
    mountApiDocs(app, doc);
    Logger.log('API docs at /api/docs', 'Swagger');
  }
}
