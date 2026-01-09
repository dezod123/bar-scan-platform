import { Injectable } from '@nestjs/common';
import { CodeType, Prisma, PrismaClient, Product } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByCode(codeValue: string, codeType: CodeType): Promise<Product | null> {
    return this.findByCodeWithClient(this.prisma, codeValue, codeType);
  }

  async listProducts(): Promise<Product[]> {
    return this.prisma.product.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }

  async createProduct(name: string, codeType: CodeType): Promise<Product> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${codeType}))`;

      const latest = await tx.product.findFirst({
        where: { codeType },
        orderBy: { codeValue: 'desc' },
      });

      const nextNumber = this.getNextCodeNumber(latest?.codeValue, codeType);
      const codeValue = this.formatCodeValue(nextNumber, codeType);

      return tx.product.create({
        data: {
          name,
          codeType,
          codeValue,
        },
      });
    });
  }

  private getNextCodeNumber(latestCode: string | undefined, codeType: CodeType): number {
    if (!latestCode) {
      return codeType === CodeType.BARCODE ? 1 : 1001;
    }

    const match = latestCode.match(/(\d+)$/);
    if (!match) {
      return codeType === CodeType.BARCODE ? 1 : 1001;
    }

    const current = Number(match[1]);
    if (!Number.isFinite(current)) {
      return codeType === CodeType.BARCODE ? 1 : 1001;
    }

    return current + 1;
  }

  private formatCodeValue(value: number, codeType: CodeType): string {
    const prefix = codeType === CodeType.BARCODE ? 'BAR-' : 'QR-';
    return `${prefix}${value.toString().padStart(4, '0')}`;
  }

  async findByCodeWithClient(
    client: PrismaClient | Prisma.TransactionClient,
    codeValue: string,
    codeType: CodeType,
  ): Promise<Product | null> {
    return client.product.findUnique({
      where: {
        codeValue_codeType: {
          codeValue,
          codeType,
        },
      },
    });
  }
}
