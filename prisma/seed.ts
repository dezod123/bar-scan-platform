import { CodeType, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const products: Array<{ name: string; codeValue: string; codeType: CodeType }> = [
  { name: 'Field Scanner Kit', codeValue: 'BAR-0001', codeType: CodeType.BARCODE },
  { name: 'Rugged Case', codeValue: 'BAR-0002', codeType: CodeType.BARCODE },
  { name: 'Battery Pack', codeValue: 'BAR-0003', codeType: CodeType.BARCODE },
  { name: 'Docking Station', codeValue: 'BAR-0004', codeType: CodeType.BARCODE },
  { name: 'Label Roll - Small', codeValue: 'BAR-0005', codeType: CodeType.BARCODE },
  { name: 'Pallet Tag', codeValue: 'QR-1001', codeType: CodeType.QR },
  { name: 'Return Crate', codeValue: 'QR-1002', codeType: CodeType.QR },
  { name: 'Warehouse Zone', codeValue: 'QR-1003', codeType: CodeType.QR },
];

export async function seed(): Promise<void> {
  for (const product of products) {
    await prisma.product.upsert({
      where: {
        codeValue_codeType: {
          codeValue: product.codeValue,
          codeType: product.codeType,
        },
      },
      update: {
        name: product.name,
      },
      create: product,
    });
  }
}

if (require.main === module) {
  seed()
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error(err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
