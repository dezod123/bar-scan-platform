import { IsEnum, IsIn } from 'class-validator';
import { ActionType } from '@prisma/client';

export class UpdateScanActionDto {
  @IsEnum(ActionType)
  @IsIn(['DEPLOY', 'RETURN'])
  action: ActionType;
}
