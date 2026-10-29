import { Injectable, NotFoundException, type PipeTransform } from '@nestjs/common';
import { isCountryCode } from '@stamped/core';

/** Accepts an ISO country code in any case, returns it upper-cased, or responds 404 for unknown codes. */
@Injectable()
export class CountryCodePipe implements PipeTransform<string, string> {
  transform(value: string): string {
    const code = String(value ?? '')
      .trim()
      .toUpperCase();
    if (!/^[A-Z]{2}$/.test(code) || !isCountryCode(code)) {
      throw new NotFoundException(`Unknown country code "${value}"`);
    }
    return code;
  }
}
