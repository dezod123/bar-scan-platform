import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { CodeType } from '@prisma/client';

export class CreateScanDto {
  @IsString()
  @IsNotEmpty()
  codeValue: string;

  @IsEnum(CodeType)
  codeType: CodeType;
}
