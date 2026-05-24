const prisma = require('./config/database');

async function main() {
  console.log('\n==================================================');
  console.log('🏪 ACTIVE SHOP OWNERS AND CUSTOMERS');
  console.log('==================================================\n');

  const shopOwners = await prisma.shopOwner.findMany({
    include: {
      user: true,
      shop: true
    }
  });

  console.log('--- 👤 SHOP OWNERS ---');
  shopOwners.forEach(so => {
    console.log(`Shop Owner Name: ${so.ownerName}`);
    console.log(`Email:           ${so.user.email}`);
    console.log(`Phone:           ${so.user.phone}`);
    console.log(`Shop ID:         ${so.shopId} (Shop Name: "${so.shop.shopName}")`);
    console.log(`Password:        Shop@123`);
    console.log('------------------------------------');
  });

  const customers = await prisma.customer.findMany({
    include: {
      user: true,
      shop: true
    }
  });

  console.log('\n--- 🧑‍🤝‍🧑 CUSTOMERS ---');
  customers.slice(0, 10).forEach(c => {
    console.log(`Customer Name:   ${c.customerName}`);
    console.log(`Customer ID:     ${c.id}`);
    console.log(`Email:           ${c.user.email}`);
    console.log(`Phone:           ${c.user.phone}`);
    console.log(`Linked Shop ID:  ${c.shopId} (Shop: "${c.shop.shopName}")`);
    console.log('------------------------------------');
  });
  if (customers.length > 10) {
    console.log(`... and ${customers.length - 10} more customers.`);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
