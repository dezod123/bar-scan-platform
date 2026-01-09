import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';
import { ScansModule } from './scans/scans.module';

@Module({
  imports: [PrismaModule, ProductsModule, ScansModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
