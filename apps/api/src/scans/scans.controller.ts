import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ActionType } from '@prisma/client';
import { CreateScanDto } from './dto/create-scan.dto';
import { UpdateScanActionDto } from './dto/update-scan-action.dto';
import { ScansService } from './scans.service';

const ALLOWED_ACTIONS = ['AWAITING', 'DEPLOY', 'RETURN'] as const;
type ActionFilter = (typeof ALLOWED_ACTIONS)[number];

@Controller('scans')
export class ScansController {
  constructor(private readonly scansService: ScansService) {}

  @Post()
  async create(@Body() dto: CreateScanDto) {
    return this.scansService.createScan(dto.codeValue, dto.codeType);
  }

  @Patch(':id/action')
  async updateAction(@Param('id') id: string, @Body() dto: UpdateScanActionDto) {
    return this.scansService.updateAction(id, dto.action);
  }

  @Get()
  async list(@Query('action') action?: ActionFilter) {
    if (action && !ALLOWED_ACTIONS.includes(action)) {
      throw new BadRequestException('Invalid action filter.');
    }
    return this.scansService.getScans(action as ActionType | undefined);
  }
}
