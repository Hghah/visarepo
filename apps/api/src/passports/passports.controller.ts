import { Controller, Get, Param } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import type { DestinationRow, PassportSummary } from '@stamped/core';
import { PublicCache } from '../common/cache-control.js';
import { CountryCodePipe } from '../common/country-code.pipe.js';
import { PassportsService } from './passports.service.js';

@ApiTags('passports')
@ApiParam({ name: 'code', example: 'IN', description: 'Passport country, ISO 3166-1 alpha-2' })
@ApiNotFoundResponse({ description: 'Unknown country code.' })
@Controller({ path: 'passports/:code', version: '1' })
export class PassportsController {
  constructor(private readonly passports: PassportsService) {}

  @Get('summary')
  @PublicCache()
  @ApiOperation({ summary: 'Counts by entry type and the mobility score for a passport' })
  @ApiOkResponse({ description: 'Counts, number of multi-option destinations, mobility score and rank.' })
  summary(@Param('code', CountryCodePipe) code: string): Promise<PassportSummary> {
    return this.passports.summary(code);
  }

  @Get('destinations')
  @PublicCache()
  @ApiOperation({ summary: 'Entry type, stay and fee for every destination, for one passport' })
  @ApiOkResponse({ description: '199 rows sorted by destination name.' })
  destinations(@Param('code', CountryCodePipe) code: string): Promise<DestinationRow[]> {
    return this.passports.destinations(code);
  }
}
