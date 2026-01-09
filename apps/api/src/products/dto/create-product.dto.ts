import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { CodeType } from '@prisma/client';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(CodeType)
  codeType: CodeType;
}
