import { Module } from '@nestjs/common';
import { CountriesModule } from '../countries/countries.module.js';
import { MobilityModule } from '../mobility/mobility.module.js';
import { PassportsController } from './passports.controller.js';
import { PassportsService } from './passports.service.js';

@Module({ imports: [CountriesModule, MobilityModule], controllers: [PassportsController], providers: [PassportsService] })
export class PassportsModule {}
