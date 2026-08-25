const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User, Company, Product, Inspection, Rule } = require('../models/Schemas');
const rulesList = require('../rules/rules');
require('dotenv').config();

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/labelguard';

async function seed() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for seeding...');

    // Clean existing data
    await User.deleteMany({});
    await Company.deleteMany({});
    await Product.deleteMany({});
    await Inspection.deleteMany({});
    await Rule.deleteMany({});

    console.log('Cleared existing database collections.');

    // Seed Rules
    await Rule.insertMany(rulesList);
    console.log(`Seeded ${rulesList.length} Legal Metrology rules.`);

    // Seed users with the role values enforced by the API and frontend.
    const hashedPassword = await bcrypt.hash('Inspector@123', 10);
    await User.create({
      username: 'Inspector Shashi Kumar',
      email: 'inspector@labelguard.ai',
      password: hashedPassword,
      inspectorId: 'LMI-2026-089',
      role: 'INSPECTOR'
    });
    await User.create({
      username: 'Controller Rajiv Nair',
      email: 'official@labelguard.ai',
      password: hashedPassword,
      inspectorId: 'LMI-OFF-05',
      role: 'OFFICIAL'
    });
    await User.create({
      username: 'System Administrator',
      email: 'admin@labelguard.ai',
      password: hashedPassword,
      inspectorId: 'LMI-ADMIN-01',
      role: 'ADMIN'
    });
    console.log('Seeded Inspector, Official, and Admin credentials.');

    // Seed Companies
    const companies = [
      { name: 'Shakti Consumer Products', productsCount: 3, inspectionsCount: 5, violationsCount: 1, averageScore: 88, repeatIssues: ['Consumer Care missing email'] },
      { name: 'ABC Foods Pvt. Ltd.', productsCount: 2, inspectionsCount: 3, violationsCount: 0, averageScore: 95, repeatIssues: [] },
      { name: 'FreshHarvest Foods', productsCount: 2, inspectionsCount: 3, violationsCount: 2, averageScore: 72, repeatIssues: ['Net Quantity unit formatting', 'Missing packaging date'] },
      { name: 'PureCare Industries', productsCount: 2, inspectionsCount: 2, violationsCount: 2, averageScore: 68, repeatIssues: ['Country of Origin missing', 'MRP format warning'] },
      { name: 'Bharat Home Products', productsCount: 1, inspectionsCount: 2, violationsCount: 0, averageScore: 92, repeatIssues: [] }
    ];

    const seededCompanies = await Company.insertMany(companies);
    console.log(`Seeded ${seededCompanies.length} companies.`);

    // Seed Products
    const products = [
      { name: 'Shakti Premium Biscuits', company: 'Shakti Consumer Products', brand: 'Shakti', category: 'Food Products', inspectionsCount: 3, averageScore: 90, lastInspectionDate: new Date('2026-08-20'), violationCount: 0 },
      { name: 'Shakti Ghee 1L', company: 'Shakti Consumer Products', brand: 'Shakti', category: 'Food Products', inspectionsCount: 2, averageScore: 85, lastInspectionDate: new Date('2026-08-22'), violationCount: 1 },
      { name: 'ABC Premium Tea', company: 'ABC Foods Pvt. Ltd.', brand: 'ABC', category: 'Food Products', inspectionsCount: 2, averageScore: 94, lastInspectionDate: new Date('2026-08-15'), violationCount: 0 },
      { name: 'ABC Digestive Cookies', company: 'ABC Foods Pvt. Ltd.', brand: 'ABC', category: 'Food Products', inspectionsCount: 1, averageScore: 96, lastInspectionDate: new Date('2026-08-18'), violationCount: 0 },
      { name: 'FreshHarvest Atta 5kg', company: 'FreshHarvest Foods', brand: 'FreshHarvest', category: 'Food Products', inspectionsCount: 2, averageScore: 70, lastInspectionDate: new Date('2026-08-12'), violationCount: 2 },
      { name: 'FreshHarvest Spices Combo', company: 'FreshHarvest Foods', brand: 'FreshHarvest', category: 'Food Products', inspectionsCount: 1, averageScore: 76, lastInspectionDate: new Date('2026-08-21'), violationCount: 0 },
      { name: 'PureCare Silky Shampoo', company: 'PureCare Industries', brand: 'PureCare', category: 'Cosmetics', inspectionsCount: 1, averageScore: 68, lastInspectionDate: new Date('2026-08-23'), violationCount: 2 },
      { name: 'PureCare Moisturizer Cream', company: 'PureCare Industries', brand: 'PureCare', category: 'Cosmetics', inspectionsCount: 1, averageScore: 68, lastInspectionDate: new Date('2026-08-19'), violationCount: 0 },
      { name: 'Bharat Dishwash Liquid', company: 'Bharat Home Products', brand: 'Bharat', category: 'Household Goods', inspectionsCount: 2, averageScore: 92, lastInspectionDate: new Date('2026-08-14'), violationCount: 0 }
    ];

    const seededProducts = await Product.insertMany(products);
    console.log(`Seeded ${seededProducts.length} products.`);

    // Seed Inspections
    const inspections = [
      {
        inspectionId: 'INSP-2026-001',
        product: 'Shakti Premium Biscuits',
        company: 'Shakti Consumer Products',
        category: 'Food Products',
        images: { frontLabel: '/uploads/demo_biscuits_front.jpg', backLabel: '/uploads/demo_biscuits_back.jpg' },
        ocrText: 'SHAKTI PREMIUM BISCUITS... Net Quantity: 200 g... MRP Rs 40.00 inclusive of all taxes...',
        declarations: {
          productName: { value: 'SHAKTI PREMIUM BISCUITS', status: 'Detected', confidence: 98, source: 'frontLabel' },
          genericName: { value: 'Biscuits', status: 'Detected', confidence: 95, source: 'frontLabel' },
          mrp: { value: 'Rs 40.00 (inclusive of all taxes)', status: 'Detected', confidence: 97, source: 'backLabel' },
          netQuantity: { value: '200 g', status: 'Detected', confidence: 94, source: 'backLabel' },
          manufacturerName: { value: 'Shakti Consumer Products Ltd.', status: 'Detected', confidence: 96, source: 'backLabel' },
          manufacturerAddress: { value: '12, Industrial Area, Mumbai', status: 'Detected', confidence: 92, source: 'backLabel' },
          countryOfOrigin: { value: 'India', status: 'Detected', confidence: 95, source: 'backLabel' },
          consumerCare: { value: 'Phone: 1800-22-4466, Email: care@shaktiproducts.in', status: 'Detected', confidence: 93, source: 'backLabel' },
          manufacturingDate: { value: '05/2026', status: 'Detected', confidence: 97, source: 'backLabel' }
        },
        checks: [
          { field: 'genericName', status: 'PASS', severity: 'high', confidence: 95, ruleId: 'LM-PC-NAME-01', reason: 'Common/Generic Name declared.', evidence: { boundingBox: [120, 240, 300, 40], text: 'Biscuits', imageType: 'frontLabel' } },
          { field: 'mrp', status: 'PASS', severity: 'high', confidence: 97, ruleId: 'LM-PC-MRP-05', reason: 'MRP declared correctly.', evidence: { boundingBox: [40, 520, 200, 40], text: 'Rs 40.00', imageType: 'backLabel' } },
          { field: 'netQuantity', status: 'PASS', severity: 'high', confidence: 94, ruleId: 'LM-PC-QTY-03', reason: 'Net Quantity declared.', evidence: { boundingBox: [40, 570, 180, 40], text: '200 g', imageType: 'backLabel' } },
          { field: 'manufacturerName', status: 'PASS', severity: 'high', confidence: 96, ruleId: 'LM-PC-MFR-02', reason: 'Manufacturer details declared.', evidence: { boundingBox: [40, 620, 350, 30], text: 'Shakti Consumer Products Ltd.', imageType: 'backLabel' } },
          { field: 'consumerCare', status: 'PASS', severity: 'high', confidence: 93, ruleId: 'LM-PC-CC-06', reason: 'Consumer care declared.', evidence: { boundingBox: [40, 720, 400, 70], text: '1800-22-4466', imageType: 'backLabel' } },
          { field: 'manufacturingDate', status: 'PASS', severity: 'medium', confidence: 97, ruleId: 'LM-PC-MFG-04', reason: 'Date declared.', evidence: { boundingBox: [40, 470, 220, 40], text: '05/2026', imageType: 'backLabel' } }
        ],
        violations: [],
        score: 100,
        status: 'COMPLIANT',
        inspector: 'Inspector Shashi Kumar',
        createdAt: new Date('2026-08-20')
      },
      {
        inspectionId: 'INSP-2026-002',
        product: 'PureCare Silky Shampoo',
        company: 'PureCare Industries',
        category: 'Cosmetics',
        images: { frontLabel: '/uploads/shampoo_front.jpg', backLabel: '/uploads/shampoo_back.jpg' },
        ocrText: 'PURECARE SILKY SHAMPOO... Net Vol: 180 ml... Mfd by: PureCare Industries... MRP Rs 165...',
        declarations: {
          productName: { value: 'PURECARE SILKY SHAMPOO', status: 'Detected', confidence: 97, source: 'frontLabel' },
          genericName: { value: 'Shampoo', status: 'Detected', confidence: 91, source: 'frontLabel' },
          mrp: { value: 'Rs 165', status: 'Detected', confidence: 96, source: 'backLabel' },
          netQuantity: { value: '180 ml', status: 'Detected', confidence: 95, source: 'backLabel' },
          manufacturerName: { value: 'PureCare Industries', status: 'Detected', confidence: 94, source: 'backLabel' },
          manufacturerAddress: { value: 'Sector 5, Baddi, HP', status: 'Detected', confidence: 91, source: 'backLabel' },
          countryOfOrigin: { value: '', status: 'Missing', confidence: 0, source: '' },
          consumerCare: { value: 'Call: 1800-11-2233', status: 'Detected', confidence: 90, source: 'backLabel' },
          manufacturingDate: { value: '04/2026', status: 'Detected', confidence: 95, source: 'backLabel' }
        },
        checks: [
          { field: 'genericName', status: 'PASS', severity: 'high', confidence: 91, ruleId: 'LM-PC-NAME-01', reason: 'Generic Name declared.', evidence: { boundingBox: [120, 240, 300, 40], text: 'Shampoo', imageType: 'frontLabel' } },
          { field: 'mrp', status: 'WARNING', severity: 'high', confidence: 96, ruleId: 'LM-PC-MRP-05', reason: 'MRP does not specify "inclusive of all taxes".', evidence: { boundingBox: [40, 520, 200, 40], text: 'Rs 165', imageType: 'backLabel' } },
          { field: 'netQuantity', status: 'PASS', severity: 'high', confidence: 95, ruleId: 'LM-PC-QTY-03', reason: 'Net Quantity declared.', evidence: { boundingBox: [40, 570, 180, 40], text: '180 ml', imageType: 'backLabel' } },
          { field: 'manufacturerName', status: 'PASS', severity: 'high', confidence: 94, ruleId: 'LM-PC-MFR-02', reason: 'Manufacturer details declared.', evidence: { boundingBox: [40, 620, 350, 30], text: 'PureCare Industries', imageType: 'backLabel' } },
          { field: 'consumerCare', status: 'WARNING', severity: 'high', confidence: 90, ruleId: 'LM-PC-CC-06', reason: 'Consumer care does not specify email address.', evidence: { boundingBox: [40, 720, 400, 70], text: '1800-11-2233', imageType: 'backLabel' } },
          { field: 'countryOfOrigin', status: 'VIOLATION', severity: 'medium', confidence: 0, ruleId: 'LM-PC-COI-07', reason: 'Country of Origin missing.', evidence: { boundingBox: null, text: '', imageType: 'backLabel' } }
        ],
        violations: [
          { field: 'mrp', ruleId: 'LM-PC-MRP-05', severity: 'low', reason: 'MRP does not specify "inclusive of all taxes".' },
          { field: 'consumerCare', ruleId: 'LM-PC-CC-06', severity: 'low', reason: 'Consumer care does not specify email address.' },
          { field: 'countryOfOrigin', ruleId: 'LM-PC-COI-07', severity: 'medium', reason: 'Country of Origin missing.' }
        ],
        score: 64,
        status: 'REVIEW REQUIRED',
        inspector: 'Inspector Shashi Kumar',
        createdAt: new Date('2026-08-23')
      }
    ];

    // Let's dynamically seed more mock inspections to reach 15 total inspections
    for (let i = 3; i <= 15; i++) {
      const isCompliant = i % 3 === 0;
      const points = isCompliant ? 100 : (i % 3 === 1 ? 82 : 45);
      const statuses = ['NON-COMPLIANT', 'REVIEW REQUIRED', 'COMPLIANT'];
      const currentStatus = isCompliant ? 'COMPLIANT' : (i % 3 === 1 ? 'REVIEW REQUIRED' : 'NON-COMPLIANT');
      
      const comp = seededCompanies[i % seededCompanies.length];
      const prodName = products[i % products.length].name;
      
      inspections.push({
        inspectionId: `INSP-2026-0${i < 10 ? '0' + i : i}`,
        product: prodName,
        company: comp.name,
        category: 'Food Products',
        images: { frontLabel: '/uploads/sample_front.jpg', backLabel: '/uploads/sample_back.jpg' },
        ocrText: 'Sample text...',
        declarations: {
          productName: { value: prodName, status: 'Detected', confidence: 95, source: 'frontLabel' },
          genericName: { value: 'Product Name', status: 'Detected', confidence: 90, source: 'frontLabel' },
          mrp: { value: 'Rs 120 (incl. of taxes)', status: 'Detected', confidence: 95, source: 'backLabel' }
        },
        checks: [
          { field: 'productName', status: 'PASS', severity: 'high', confidence: 95, ruleId: 'LM-PC-NAME-01', reason: 'Passed' },
          { field: 'mrp', status: 'PASS', severity: 'high', confidence: 95, ruleId: 'LM-PC-MRP-05', reason: 'Passed' }
        ],
        violations: currentStatus !== 'COMPLIANT' ? [{ field: 'consumerCare', ruleId: 'LM-PC-CC-06', severity: 'high', reason: 'Missing Consumer Care Cell' }] : [],
        score: points,
        status: currentStatus,
        inspector: 'Inspector Shashi Kumar',
        createdAt: new Date(Date.now() - (15 - i) * 24 * 60 * 60 * 1000)
      });
    }

    await Inspection.insertMany(inspections);
    console.log(`Seeded ${inspections.length} total inspections.`);

    console.log('Database seeding successfully finished!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
