const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanup() {
  console.log('Fetching all products...');
  const products = await prisma.product.findMany();
  
  const seen = new Set();
  const duplicates = [];
  
  for (const product of products) {
    const key = `${product.shopId}-${product.productName.toLowerCase()}`;
    if (seen.has(key)) {
      duplicates.push(product.id);
    } else {
      seen.add(key);
    }
  }
  
  console.log(`Found ${duplicates.length} duplicate products. Deleting...`);
  
  if (duplicates.length > 0) {
    const res = await prisma.product.deleteMany({
      where: {
        id: { in: duplicates }
      }
    });
    console.log(`Deleted ${res.count} duplicates.`);
  } else {
    console.log('No duplicates found.');
  }
  
  await prisma.$disconnect();
}

cleanup().catch(e => {
  console.error(e);
  process.exit(1);
});
