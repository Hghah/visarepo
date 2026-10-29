import { Controller, Get, Param } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import type { EntryDetail } from '@stamped/core';
import { PublicCache } from '../common/cache-control.js';
import { CountryCodePipe } from '../common/country-code.pipe.js';
import { EntriesService } from './entries.service.js';

@ApiTags('entries')
@Controller({ path: 'entries', version: '1' })
export class EntriesController {
  constructor(private readonly entries: EntriesService) {}

  @Get(':passport/:destination')
  @PublicCache()
  @ApiOperation({ summary: 'Full entry rule for one passport and destination, with every way in' })
  @ApiParam({ name: 'passport', example: 'IN' })
  @ApiParam({ name: 'destination', example: 'KH' })
  @ApiOkResponse({ description: 'Entry type, stay, fee, note, options, official links, and both countries.' })
  @ApiNotFoundResponse({ description: 'Unknown country code.' })
  detail(
    @Param('passport', CountryCodePipe) passport: string,
    @Param('destination', CountryCodePipe) destination: string,
  ): Promise<EntryDetail> {
    return this.entries.detail(passport, destination);
  }
}
