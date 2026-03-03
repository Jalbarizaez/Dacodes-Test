import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * Seed database with initial data
 */
async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@dacodes.com' },
    update: {},
    create: {
      email: 'admin@dacodes.com',
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
      isActive: true,
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // Create manager user
  const managerPassword = await bcrypt.hash('manager123', 10);
  const manager = await prisma.user.upsert({
    where: { email: 'manager@dacodes.com' },
    update: {},
    create: {
      email: 'manager@dacodes.com',
      passwordHash: managerPassword,
      role: UserRole.MANAGER,
      isActive: true,
    },
  });
  console.log('✅ Manager user created:', manager.email);

  // Create operator user
  const operatorPassword = await bcrypt.hash('operator123', 10);
  const operator = await prisma.user.upsert({
    where: { email: 'operator@dacodes.com' },
    update: {},
    create: {
      email: 'operator@dacodes.com',
      passwordHash: operatorPassword,
      role: UserRole.OPERATOR,
      isActive: true,
    },
  });
  console.log('✅ Operator user created:', operator.email);

  // Create sample warehouse
  const warehouse = await prisma.warehouse.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Main Warehouse',
      address: '123 Main St, City, Country',
      isActive: true,
    },
  });
  console.log('✅ Warehouse created:', warehouse.name);

  // Create sample locations
  const locations = await Promise.all([
    prisma.location.upsert({
      where: { id: '00000000-0000-0000-0000-000000000011' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000011',
        warehouseId: warehouse.id,
        code: 'A-01',
        capacity: 1000,
        isActive: true,
      },
    }),
    prisma.location.upsert({
      where: { id: '00000000-0000-0000-0000-000000000012' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000012',
        warehouseId: warehouse.id,
        code: 'A-02',
        capacity: 1000,
        isActive: true,
      },
    }),
    prisma.location.upsert({
      where: { id: '00000000-0000-0000-0000-000000000013' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000013',
        warehouseId: warehouse.id,
        code: 'B-01',
        capacity: 500,
        isActive: true,
      },
    }),
  ]);
  console.log(`✅ ${locations.length} locations created`);

  // Create sample categories
  const electronicsCategory = await prisma.category.upsert({
    where: { id: '00000000-0000-0000-0000-000000000031' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000031',
      name: 'Electronics',
      description: 'Electronic products and components',
      isActive: true,
    },
  });
  console.log('✅ Category created:', electronicsCategory.name);

  const officeCategory = await prisma.category.upsert({
    where: { id: '00000000-0000-0000-0000-000000000032' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000032',
      name: 'Office Supplies',
      description: 'Office supplies and stationery',
      isActive: true,
    },
  });
  console.log('✅ Category created:', officeCategory.name);

  // Create sample supplier
  const supplier = await prisma.supplier.upsert({
    where: { id: '00000000-0000-0000-0000-000000000021' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000021',
      name: 'Sample Supplier Inc.',
      contactName: 'John Doe',
      email: 'contact@samplesupplier.com',
      phone: '+1-555-0123',
      paymentTerms: 'Net 30',
      leadTimeDays: 7,
      isActive: true,
    },
  });
  console.log('✅ Supplier created:', supplier.name);

  // Create sample products
  const products = await Promise.all([
    prisma.product.upsert({
      where: { sku: 'PROD-001' },
      update: {},
      create: {
        sku: 'PROD-001',
        name: 'Sample Product 1',
        description: 'This is a sample product for testing',
        categoryId: electronicsCategory.id,
        unitOfMeasure: 'UNIT',
        minStock: 10,
        maxStock: 100,
        isActive: true,
      },
    }),
    prisma.product.upsert({
      where: { sku: 'PROD-002' },
      update: {},
      create: {
        sku: 'PROD-002',
        name: 'Sample Product 2',
        description: 'Another sample product',
        categoryId: electronicsCategory.id,
        unitOfMeasure: 'UNIT',
        minStock: 5,
        maxStock: 50,
        isActive: true,
      },
    }),
    prisma.product.upsert({
      where: { sku: 'PROD-003' },
      update: {},
      create: {
        sku: 'PROD-003',
        name: 'Office Chair',
        description: 'Ergonomic office chair',
        categoryId: officeCategory.id,
        unitOfMeasure: 'UNIT',
        minStock: 2,
        maxStock: 20,
        isActive: true,
      },
    }),
  ]);
  console.log(`✅ ${products.length} products created`);

  // Create sample reorder rules
  const reorderRules = await Promise.all([
    prisma.reorderRule.upsert({
      where: { productId: products[0].id },
      update: {},
      create: {
        productId: products[0].id,
        minimumQuantity: 10,
        reorderQuantity: 50,
        isEnabled: true,
      },
    }),
    prisma.reorderRule.upsert({
      where: { productId: products[1].id },
      update: {},
      create: {
        productId: products[1].id,
        minimumQuantity: 5,
        reorderQuantity: 30,
        isEnabled: true,
      },
    }),
  ]);
  console.log(`✅ ${reorderRules.length} reorder rules created`);

  console.log('🎉 Database seed completed successfully!');
  console.log('\n📝 Test credentials:');
  console.log('   Admin: admin@dacodes.com / admin123');
  console.log('   Manager: manager@dacodes.com / manager123');
  console.log('   Operator: operator@dacodes.com / operator123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
