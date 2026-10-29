import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { MobilityRow } from '@stamped/core';
import { PublicCache } from '../common/cache-control.js';
import { MobilityService } from './mobility.service.js';

@ApiTags('mobility')
@Controller({ path: 'mobility', version: '1' })
export class MobilityController {
  constructor(private readonly mobility: MobilityService) {}

  @Get()
  @PublicCache()
  @ApiOperation({ summary: 'Mobility ranking of all passports' })
  @ApiOkResponse({ description: 'Passports ordered from strongest to weakest, with score and rank.' })
  ranking(): Promise<MobilityRow[]> {
    return this.mobility.ranking();
  }
}
