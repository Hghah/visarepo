import { Module } from '@nestjs/common';
import { CountriesModule } from '../countries/countries.module.js';
import { EntriesController } from './entries.controller.js';
import { EntriesService } from './entries.service.js';

@Module({ imports: [CountriesModule], controllers: [EntriesController], providers: [EntriesService] })
export class EntriesModule {}
