import { Controller, Get, Param } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import type { PassportRow } from '@stamped/core';
import { PublicCache } from '../common/cache-control.js';
import { CountryCodePipe } from '../common/country-code.pipe.js';
import { DestinationsService } from './destinations.service.js';

@ApiTags('destinations')
@Controller({ path: 'destinations', version: '1' })
export class DestinationsController {
  constructor(private readonly destinations: DestinationsService) {}

  @Get(':code/passports')
  @PublicCache()
  @ApiOperation({ summary: 'How every passport enters one destination' })
  @ApiParam({ name: 'code', example: 'TH', description: 'Destination, ISO 3166-1 alpha-2' })
  @ApiOkResponse({ description: '199 rows sorted by passport name.' })
  @ApiNotFoundResponse({ description: 'Unknown country code.' })
  passports(@Param('code', CountryCodePipe) code: string): Promise<PassportRow[]> {
    return this.destinations.passports(code);
  }
}
