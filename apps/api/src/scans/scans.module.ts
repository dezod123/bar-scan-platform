import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ProductsModule } from '../products/products.module';
import { ScansController } from './scans.controller';
import { ScansService } from './scans.service';

@Module({
  imports: [PrismaModule, ProductsModule],
  controllers: [ScansController],
  providers: [ScansService],
})
export class ScansModule {}
