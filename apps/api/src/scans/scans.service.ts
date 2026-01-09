import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ActionType, CodeType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from '../products/products.service';

@Injectable()
export class ScansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productsService: ProductsService,
  ) {}

  async createScan(
    codeValue: string,
    codeType: CodeType,
  ): Promise<{
    scan: Prisma.ScanGetPayload<{ include: { product: true } }>;
    wasDuplicate: boolean;
  }> {
    const lockKey = `${codeType}:${codeValue}`;
    const cooldownSeconds = this.getCooldownSeconds();
    const cooldownCutoff = new Date(Date.now() - cooldownSeconds * 1000);

    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;

      const product = await this.productsService.findByCodeWithClient(tx, codeValue, codeType);
      if (!product) {
        throw new NotFoundException('Unknown code. No matching product found.');
      }

      const recentScan = await tx.scan.findFirst({
        where: {
          codeValue,
          codeType,
          createdAt: {
            gte: cooldownCutoff,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          product: true,
        },
      });

      if (recentScan) {
        return {
          scan: recentScan,
          wasDuplicate: true,
        };
      }

      const scan = await tx.scan.create({
        data: {
          codeValue,
          codeType,
          productId: product.id,
          action: ActionType.AWAITING,
        },
        include: {
          product: true,
        },
      });

      return {
        scan,
        wasDuplicate: false,
      };
    });
  }

  async updateAction(
    id: string,
    action: ActionType,
  ): Promise<Prisma.ScanGetPayload<{ include: { product: true } }>> {
    const updateResult = await this.prisma.scan.updateMany({
      where: {
        id,
        OR: [{ action: ActionType.AWAITING }, { action: null }],
      },
      data: {
        action,
      },
    });

    if (updateResult.count === 0) {
      const existing = await this.prisma.scan.findUnique({ where: { id } });
      if (!existing) {
        throw new NotFoundException('Scan not found.');
      }
      throw new BadRequestException('Action already set. Transition not allowed.');
    }

    return this.prisma.scan.findUniqueOrThrow({
      where: { id },
      include: {
        product: true,
      },
    });
  }

  async getScans(
    action?: ActionType,
  ): Promise<Array<Prisma.ScanGetPayload<{ include: { product: true } }>>> {
    const where: Prisma.ScanWhereInput | undefined =
      action === ActionType.AWAITING
        ? { OR: [{ action: ActionType.AWAITING }, { action: null }] }
        : action
          ? { action }
          : undefined;
    return this.prisma.scan.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        product: true,
      },
    });
  }

  private getCooldownSeconds(): number {
    const raw = process.env.SCAN_COOLDOWN_SECONDS;
    const parsed = raw ? Number(raw) : 5;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 5;
  }
}
