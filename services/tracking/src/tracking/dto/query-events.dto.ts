import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsISO8601, IsOptional, Max, Min } from 'class-validator';
import { EventSource, TrackingEventType } from '../../../generated/client';

/**
 * Filtering + cursor/offset pagination for event history and the internal
 * dashboard. `cursor` is the id of the last item from the previous page; when
 * provided it takes precedence over `offset` for stable deep pagination.
 */
export class QueryEventsDto {
  @IsOptional()
  @IsEnum(TrackingEventType)
  type?: TrackingEventType;

  @IsOptional()
  @IsEnum(EventSource)
  source?: EventSource;

  @IsOptional()
  @IsISO8601()
  from?: string;

  @IsOptional()
  @IsISO8601()
  to?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}
