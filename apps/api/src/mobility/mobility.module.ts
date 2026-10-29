import { Module } from '@nestjs/common';
import { MobilityController } from './mobility.controller.js';
import { MobilityService } from './mobility.service.js';

@Module({ controllers: [MobilityController], providers: [MobilityService], exports: [MobilityService] })
export class MobilityModule {}
