import { Controller, Get, Param } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import type { CountryDetail, CountrySummary } from '@stamped/core';
import { PublicCache } from '../common/cache-control.js';
import { CountryCodePipe } from '../common/country-code.pipe.js';
import { CountriesService } from './countries.service.js';

@ApiTags('countries')
@Controller({ path: 'countries', version: '1' })
export class CountriesController {
  constructor(private readonly countries: CountriesService) {}

  @Get()
  @PublicCache()
  @ApiOperation({ summary: 'All 199 countries (each is both a passport and a destination)' })
  @ApiOkResponse({ description: 'Countries sorted by name.' })
  list(): Promise<CountrySummary[]> {
    return this.countries.list();
  }

  @Get(':code')
  @PublicCache()
  @ApiOperation({ summary: 'One country with its main airport and best time to visit' })
  @ApiParam({ name: 'code', example: 'VN', description: 'ISO 3166-1 alpha-2 code' })
  @ApiNotFoundResponse({ description: 'Unknown country code.' })
  detail(@Param('code', CountryCodePipe) code: string): Promise<CountryDetail> {
    return this.countries.detail(code);
  }
}
