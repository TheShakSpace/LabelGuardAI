const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config();

const rulesList = require('./rules/rules');
const { processImageOCR } = require('./services/ocrService');
const { runComplianceCheck } = require('./services/complianceEngine');
const { generateInspectionPDF } = require('./services/reportService');
const { askCopilot } = require('./services/geminiService');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeyforlabelguardai123';
const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/labelguard';

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
app.use('/uploads', express.static(uploadsDir));

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

// ----------------------------------------------------
// DATABASE FALLBACK CONFIGURATION
// ----------------------------------------------------
let isInMemoryMode = false;
const memoryDb = {
  users: [],
  companies: [],
  products: [],
  inspections: [],
  rules: [...rulesList],
  notifications: [
    { _id: 'n1', title: 'High-Risk Commodity Detected', message: 'PureCare Silky Shampoo flagged with High Risk due to missing Country of Origin.', read: false, type: 'risk', createdAt: new Date() },
    { _id: 'n2', title: 'Repeat Violation Flagged', message: 'FreshHarvest Atta 5kg has repeat violations in Net Quantity formatting.', read: false, type: 'warning', createdAt: new Date(Date.now() - 3600000) }
  ]
};

async function seedMemoryDb() {
  const adminHash = await bcrypt.hash('Inspector@123', 10);
  memoryDb.users.push({
    _id: 'usr_admin',
    username: 'System Administrator',
    email: 'admin@labelguard.ai',
    password: adminHash,
    inspectorId: 'LMI-ADMIN-01',
    role: 'ADMIN'
  });

  const inspectorHash = await bcrypt.hash('Inspector@123', 10);
  memoryDb.users.push({
    _id: 'usr_01',
    username: 'Inspector Shashi Kumar',
    email: 'inspector@labelguard.ai',
    password: inspectorHash,
    inspectorId: 'LMI-2026-089',
    role: 'INSPECTOR'
  });

  const officialHash = await bcrypt.hash('Inspector@123', 10);
  memoryDb.users.push({
    _id: 'usr_official',
    username: 'Controller Rajiv Nair',
    email: 'official@labelguard.ai',
    password: officialHash,
    inspectorId: 'LMI-OFF-05',
    role: 'OFFICIAL'
  });

  memoryDb.companies = [
    { _id: 'c1', name: 'Shakti Consumer Products', productsCount: 3, inspectionsCount: 5, violationsCount: 1, averageScore: 88, repeatIssues: ['Consumer Care missing email'] },
    { _id: 'c2', name: 'ABC Foods Pvt. Ltd.', productsCount: 2, inspectionsCount: 3, violationsCount: 0, averageScore: 95, repeatIssues: [] },
    { _id: 'c3', name: 'FreshHarvest Foods', productsCount: 2, inspectionsCount: 3, violationsCount: 2, averageScore: 72, repeatIssues: ['Net Quantity unit formatting', 'Missing packaging date'] },
    { _id: 'c4', name: 'PureCare Industries', productsCount: 2, inspectionsCount: 2, violationsCount: 2, averageScore: 68, repeatIssues: ['Country of Origin missing', 'MRP format warning'] },
    { _id: 'c5', name: 'Bharat Home Products', productsCount: 1, inspectionsCount: 2, violationsCount: 0, averageScore: 92, repeatIssues: [] }
  ];

  memoryDb.products = [
    { _id: 'p1', name: 'Shakti Premium Biscuits', company: 'Shakti Consumer Products', brand: 'Shakti', category: 'Food Products', inspectionsCount: 3, averageScore: 90, lastInspectionDate: new Date('2026-08-20'), violationCount: 0 },
    { _id: 'p2', name: 'Shakti Ghee 1L', company: 'Shakti Consumer Products', brand: 'Shakti', category: 'Food Products', inspectionsCount: 2, averageScore: 85, lastInspectionDate: new Date('2026-08-22'), violationCount: 1 },
    { _id: 'p3', name: 'ABC Premium Tea', company: 'ABC Foods Pvt. Ltd.', brand: 'ABC', category: 'Food Products', inspectionsCount: 2, averageScore: 94, lastInspectionDate: new Date('2026-08-15'), violationCount: 0 },
    { _id: 'p4', name: 'ABC Digestive Cookies', company: 'ABC Foods Pvt. Ltd.', brand: 'ABC', category: 'Food Products', inspectionsCount: 1, averageScore: 96, lastInspectionDate: new Date('2026-08-18'), violationCount: 0 },
    { _id: 'p5', name: 'FreshHarvest Atta 5kg', company: 'FreshHarvest Foods', brand: 'FreshHarvest', category: 'Food Products', inspectionsCount: 2, averageScore: 70, lastInspectionDate: new Date('2026-08-12'), violationCount: 2 },
    { _id: 'p6', name: 'FreshHarvest Spices Combo', company: 'FreshHarvest Foods', brand: 'FreshHarvest', category: 'Food Products', inspectionsCount: 1, averageScore: 76, lastInspectionDate: new Date('2026-08-21'), violationCount: 0 },
    { _id: 'p7', name: 'PureCare Silky Shampoo', company: 'PureCare Industries', brand: 'PureCare', category: 'Cosmetics', inspectionsCount: 1, averageScore: 68, lastInspectionDate: new Date('2026-08-23'), violationCount: 2 },
    { _id: 'p8', name: 'PureCare Moisturizer Cream', company: 'PureCare Industries', brand: 'PureCare', category: 'Cosmetics', inspectionsCount: 1, averageScore: 68, lastInspectionDate: new Date('2026-08-19'), violationCount: 0 },
    { _id: 'p9', name: 'Bharat Dishwash Liquid', company: 'Bharat Home Products', brand: 'Bharat', category: 'Household Goods', inspectionsCount: 2, averageScore: 92, lastInspectionDate: new Date('2026-08-14'), violationCount: 0 }
  ];

  // Seed 15 inspections
  for (let i = 1; i <= 15; i++) {
    const isCompliant = i % 3 === 0;
    const score = isCompliant ? 100 : (i % 3 === 1 ? 82 : 45);
    const status = isCompliant ? 'COMPLIANT' : (i % 3 === 1 ? 'REVIEW REQUIRED' : 'NON-COMPLIANT');
    const comp = memoryDb.companies[i % memoryDb.companies.length];
    const prod = memoryDb.products[i % memoryDb.products.length];
    
    memoryDb.inspections.push({
      inspectionId: `INSP-2026-0${i < 10 ? '0' + i : i}`,
      productId: prod._id,
      companyId: comp._id,
      product: prod.name,
      company: comp.name,
      category: 'Food Products',
      images: { frontLabel: '/uploads/sample_front.jpg', backLabel: '/uploads/sample_back.jpg' },
      ocrText: 'MRP Rs 120 (inclusive of all taxes) Net Quantity 500g Manufactured by fresh harvest...',
      declarations: {
        productName: { value: prod.name, status: 'Detected', confidence: 95, source: 'frontLabel' },
        genericName: { value: 'Commodity Item', status: 'Detected', confidence: 90, source: 'frontLabel' },
        mrp: { value: 'Rs 120 (incl. of taxes)', status: 'Detected', confidence: 95, source: 'backLabel' }
      },
      checks: [
        { field: 'productName', status: 'PASS', severity: 'high', confidence: 95, ruleId: 'LM-PC-NAME-01', reason: 'Passed' },
        { field: 'mrp', status: 'PASS', severity: 'high', confidence: 95, ruleId: 'LM-PC-MRP-05', reason: 'Passed' }
      ],
      violations: status !== 'COMPLIANT' ? [{ field: 'consumerCare', ruleId: 'LM-PC-CC-06', severity: 'high', reason: 'Missing Consumer Care Cell details.' }] : [],
      score: score,
      status: status,
      riskLevel: status === 'COMPLIANT' ? 'LOW' : (status === 'REVIEW REQUIRED' ? 'MEDIUM' : 'HIGH'),
      inspector: 'Inspector Shashi Kumar',
      location: 'New Delhi Sandbox',
      notes: 'Standard inspection check.',
      auditTrail: [
        { timestamp: new Date(), user: 'Inspector Shashi Kumar', action: 'CREATED', details: 'Inspection draft initiated.' },
        { timestamp: new Date(), user: 'System Engine', action: 'OCR_COMPLETED', details: 'Extracted raw data parsed.' }
      ],
      createdAt: new Date(Date.now() - (15 - i) * 24 * 60 * 60 * 1000)
    });
  }
}

// ----------------------------------------------------
// DB ABSTRACTION REPOSITORY
// ----------------------------------------------------
const db = {
  User: {
    findOne: async (q) => {
      if (!isInMemoryMode) return require('./models/Schemas').User.findOne(q);
      return memoryDb.users.find(u => u.email === q.email);
    },
    findById: async (id) => {
      if (!isInMemoryMode) return require('./models/Schemas').User.findById(id);
      return memoryDb.users.find(u => u._id === id || u.id === id);
    }
  },
  Company: {
    find: async () => {
      if (!isInMemoryMode) return require('./models/Schemas').Company.find().sort({ name: 1 });
      return [...memoryDb.companies].sort((a,b) => a.name.localeCompare(b.name));
    },
    findOne: async (q) => {
      if (!isInMemoryMode) return require('./models/Schemas').Company.findOne(q);
      return memoryDb.companies.find(c => c.name === q.name);
    },
    create: async (data) => {
      if (!isInMemoryMode) return require('./models/Schemas').Company.create(data);
      const newCompany = { _id: 'c_' + Date.now(), name: data.name, productsCount: 0, inspectionsCount: 0, violationsCount: 0, averageScore: 100, repeatIssues: [], ...data };
      memoryDb.companies.push(newCompany);
      return newCompany;
    }
  },
  Product: {
    find: async () => {
      if (!isInMemoryMode) return require('./models/Schemas').Product.find().sort({ name: 1 });
      return [...memoryDb.products].sort((a,b) => a.name.localeCompare(b.name));
    },
    findOne: async (q) => {
      if (!isInMemoryMode) return require('./models/Schemas').Product.findOne(q);
      return memoryDb.products.find(p => p.name === q.name && p.company === q.company);
    },
    create: async (data) => {
      if (!isInMemoryMode) return require('./models/Schemas').Product.create(data);
      const newProd = { _id: 'p_' + Date.now(), inspectionsCount: 0, averageScore: 100, violationCount: 0, ...data };
      memoryDb.products.push(newProd);
      return newProd;
    }
  },
  Inspection: {
    countDocuments: async () => {
      if (!isInMemoryMode) return require('./models/Schemas').Inspection.countDocuments();
      return memoryDb.inspections.length;
    },
    find: (query = {}) => {
      const getExecution = async () => {
        if (!isInMemoryMode) return require('./models/Schemas').Inspection.find(query);
        let results = [...memoryDb.inspections];
        if (query.status) results = results.filter(r => r.status === query.status);
        if (query.category) results = results.filter(r => r.category === query.category);
        return results;
      };
      
      const chainable = {
        sort: () => ({
          limit: (n) => ({
            then: async (resolve) => {
              const items = await getExecution();
              const sorted = items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
              resolve(sorted.slice(0, n));
            }
          }),
          then: async (resolve) => {
            const items = await getExecution();
            const sorted = items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            resolve(sorted);
          }
        }),
        then: async (resolve) => resolve(await getExecution())
      };
      return chainable;
    },
    findOne: async (q) => {
      if (!isInMemoryMode) return require('./models/Schemas').Inspection.findOne(q);
      return memoryDb.inspections.find(i => i.inspectionId === q.inspectionId);
    },
    create: async (data) => {
      if (!isInMemoryMode) return require('./models/Schemas').Inspection.create(data);
      const newInsp = { _id: 'i_' + Date.now(), createdAt: new Date(), ...data };
      memoryDb.inspections.push(newInsp);
      return newInsp;
    }
  },
  Rule: {
    find: async () => {
      if (!isInMemoryMode) return require('./models/Schemas').Rule.find();
      return memoryDb.rules;
    },
    findOneAndUpdate: async (filter, update) => {
      if (!isInMemoryMode) return require('./models/Schemas').Rule.findOneAndUpdate(filter, update, { new: true });
      const rule = memoryDb.rules.find(r => r.ruleId === filter.ruleId);
      if (rule) {
        Object.assign(rule, update);
      }
      return rule;
    }
  },
  Notification: {
    find: async () => {
      if (!isInMemoryMode) return require('./models/Schemas').Notification.find().sort({ createdAt: -1 });
      return [...memoryDb.notifications].sort((a,b) => b.createdAt - a.createdAt);
    },
    create: async (data) => {
      if (!isInMemoryMode) return require('./models/Schemas').Notification.create(data);
      const newNotif = { _id: 'n_' + Date.now(), read: false, createdAt: new Date(), ...data };
      memoryDb.notifications.push(newNotif);
      return newNotif;
    },
    findByIdAndUpdate: async (id, update) => {
      if (!isInMemoryMode) return require('./models/Schemas').Notification.findByIdAndUpdate(id, update, { new: true });
      const notif = memoryDb.notifications.find(n => n._id === id);
      if (notif) Object.assign(notif, update);
      return notif;
    }
  }
};

// Protect middleware
const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      
      const user = await db.User.findById(decoded.id);
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }
      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// ----------------------------------------------------
// AUTH ENDPOINTS
// ----------------------------------------------------

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await db.User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    const token = jwt.sign({ id: user._id || user.id }, JWT_SECRET, { expiresIn: '30d' });
    res.json({
      token,
      user: {
        id: user._id || user.id,
        username: user.username,
        email: user.email,
        inspectorId: user.inspectorId,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Authentication failed.', error: error.message });
  }
});

app.get('/api/auth/me', protect, (req, res) => {
  res.json({
    id: req.user._id || req.user.id,
    username: req.user.username,
    email: req.user.email,
    inspectorId: req.user.inspectorId,
    role: req.user.role
  });
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ message: 'Logout successful' });
});

// ----------------------------------------------------
// NOTIFICATION ENDPOINTS
// ----------------------------------------------------
app.get('/api/notifications', protect, async (req, res) => {
  try {
    const notifications = await db.Notification.find();
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving notifications' });
  }
});

app.put('/api/notifications/:id/read', protect, async (req, res) => {
  try {
    const updated = await db.Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Error updating notification' });
  }
});

// ----------------------------------------------------
// INSPECTOR COPILOT (PHASE 14)
// ----------------------------------------------------
app.post('/api/copilot', protect, async (req, res) => {
  const { question, inspectionId } = req.body;
  if (!question) {
    return res.status(400).json({ message: 'Question parameter is required.' });
  }

  try {
    let inspection = null;
    if (inspectionId) {
      inspection = await db.Inspection.findOne({ inspectionId });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ message: 'Gemini API key is not configured.' });
    }

    const systemPrompt = `
You are the LabelGuard AI Inspector Copilot, an expert assistant in Legal Metrology (Packaged Commodities) Rules, 2011.
You help inspectors interpret inspection results, understand rule compliance, and find evidence.
Here is the inspection context:
${inspection ? JSON.stringify({
  inspectionId: inspection.inspectionId,
  productName: inspection.productName,
  category: inspection.category,
  score: inspection.score,
  status: inspection.status,
  riskLevel: inspection.riskLevel,
  riskReasons: inspection.riskReasons,
  declarations: inspection.declarations,
  checks: inspection.checks,
  violations: inspection.violations
}, null, 2) : 'No specific inspection context is loaded yet.'}

Answer the inspector's query precisely using ONLY the provided inspection data and legal metrology rules context.
If the information is not available in the context, respond with: "I could not verify this from the configured inspection data and rule base."
Do not invent any rules, values, or findings that are not explicitly present in the data. Keep answers professional and concise.
`;

    const responseText = await askCopilot(systemPrompt, question);
    res.json({ response: responseText });
  } catch (error) {
    console.error('Copilot API error:', error.message);
    res.status(500).json({ message: 'AI analysis temporarily unavailable.', error: error.message });
  }
});

// ----------------------------------------------------
// DYNAMIC RULES MANAGEMENT
// ----------------------------------------------------
app.get('/api/rules', protect, async (req, res) => {
  try {
    const list = await db.Rule.find();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving rules.' });
  }
});

app.put('/api/rules/:ruleId/toggle', protect, async (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Permission denied. Admins only.' });
  }
  const { active } = req.body;
  try {
    const updatedRule = await db.Rule.findOneAndUpdate(
      { ruleId: req.params.ruleId },
      { active: active }
    );
    res.json(updatedRule);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update rule status.' });
  }
});

// ----------------------------------------------------
// INSPECTION ENDPOINTS
// ----------------------------------------------------

app.get('/api/dashboard', protect, async (req, res) => {
  try {
    const totalInspections = await db.Inspection.countDocuments();
    const productsCount = (await db.Product.find()).length;
    let totalViolations = 0;
    let avgScore = 0;
    let recentInspections = [];
    let trend = [];
    let severity = { high: 0, medium: 0, low: 0 };

    if (!isInMemoryMode) {
      const MongooseInspection = require('./models/Schemas').Inspection;
      const violationsCount = await MongooseInspection.aggregate([
        { $group: { _id: null, total: { $sum: { $size: '$violations' } } } }
      ]);
      totalViolations = violationsCount.length > 0 ? violationsCount[0].total : 0;

      const avgScoreResult = await MongooseInspection.aggregate([
        { $group: { _id: null, avgScore: { $avg: '$score' } } }
      ]);
      avgScore = avgScoreResult.length > 0 ? Math.round(avgScoreResult[0].avgScore) : 100;
      recentInspections = await MongooseInspection.find().sort({ createdAt: -1 }).limit(6);
      
      const trendData = await MongooseInspection.find().sort({ createdAt: 1 }).limit(10);
      trend = trendData.map(t => ({
        date: new Date(t.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        score: t.score,
        product: t.product
      }));

      const severityData = await MongooseInspection.aggregate([
        { $unwind: '$violations' },
        { $group: { _id: '$violations.severity', count: { $sum: 1 } } }
      ]);
      severity = {
        high: (severityData.find(s => s._id === 'high') || { count: 0 }).count,
        medium: (severityData.find(s => s._id === 'medium') || { count: 0 }).count,
        low: (severityData.find(s => s._id === 'low') || { count: 0 }).count
      };
    } else {
      totalViolations = memoryDb.inspections.reduce((sum, item) => sum + (item.violations?.length || 0), 0);
      const totalScoreSum = memoryDb.inspections.reduce((sum, item) => sum + item.score, 0);
      avgScore = memoryDb.inspections.length > 0 ? Math.round(totalScoreSum / memoryDb.inspections.length) : 100;
      
      recentInspections = [...memoryDb.inspections]
        .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 6);

      trend = [...memoryDb.inspections]
        .sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt))
        .slice(-10)
        .map(t => ({
          date: new Date(t.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
          score: t.score,
          product: t.product
        }));

      memoryDb.inspections.forEach(i => {
        i.violations?.forEach(v => {
          if (v.severity === 'high') severity.high++;
          else if (v.severity === 'medium') severity.medium++;
          else severity.low++;
        });
      });
    }

    res.json({
      stats: { totalInspections, productsCount, totalViolations, avgScore },
      recentInspections,
      trend,
      severity
    });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving dashboard.', error: error.message });
  }
});

app.post('/api/inspections/analyze', protect, upload.fields([
  { name: 'frontLabel', maxCount: 1 },
  { name: 'backLabel', maxCount: 1 }
]), async (req, res) => {
  try {
    const { category, demoProductKey } = req.body;
    let frontPath = '', backPath = '';

    if (req.files) {
      if (req.files.frontLabel) frontPath = `/uploads/${req.files.frontLabel[0].filename}`;
      if (req.files.backLabel) backPath = `/uploads/${req.files.backLabel[0].filename}`;
    }

    // Active rules check
    const activeRules = await db.Rule.find();

    const ocrResult = await processImageOCR(frontPath, backPath, demoProductKey || 'shakti_biscuits');
    const verification = runComplianceCheck(ocrResult.declarations, category || 'Food Products', activeRules);

    res.json({
      images: {
        frontLabel: frontPath || '/uploads/placeholder_front.jpg',
        backLabel: backPath || '/uploads/placeholder_back.jpg'
      },
      ocrText: ocrResult.rawText,
      preprocessingStats: ocrResult.preprocessingStats,
      declarations: verification.declarations,
      checks: verification.checks,
      violations: verification.violations,
      score: verification.score,
      status: verification.status,
      riskLevel: verification.riskLevel,
      riskReasons: verification.riskReasons,
      qualityMetrics: ocrResult.qualityMetrics
    });
  } catch (error) {
    console.error("Analysis route error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.stack,
      stage: error.stage || 'IMAGE_PROCESSING'
    });
  }
});

app.post('/api/inspections', protect, async (req, res) => {
  try {
    const data = req.body;
    const inspectionId = `INSP-2026-${String(Math.floor(1000 + Math.random() * 9000))}`;

    // Log audit trail actions
    const auditTrail = [
      { timestamp: new Date(), user: req.user.username, action: 'CREATED', details: 'Inspection finalized by Inspector.' }
    ];

    const newInspection = await db.Inspection.create({
      inspectionId,
      ...data,
      inspector: req.user.username,
      auditTrail
    });

    // Update stats
    let companyObj = await db.Company.findOne({ name: data.company });
    if (!companyObj) {
      companyObj = await db.Company.create({ name: data.company });
    }
    companyObj.inspectionsCount += 1;
    companyObj.violationsCount += data.violations.length;
    
    let prodObj = await db.Product.findOne({ name: data.product, company: data.company });
    if (!prodObj) {
      prodObj = await db.Product.create({ name: data.product, company: data.company, category: data.category });
    }
    prodObj.inspectionsCount += 1;
    prodObj.lastInspectionDate = new Date();
    prodObj.violationCount += data.violations.length;

    if (!isInMemoryMode) {
      await companyObj.save();
      await prodObj.save();
    }

    // Trigger Notification for high risk items
    if (newInspection.riskLevel === 'HIGH') {
      await db.Notification.create({
        title: 'High-Risk Violations Flagged',
        message: `${newInspection.product} manufactured by ${newInspection.company} failed inspection with Score ${newInspection.score}.`,
        type: 'risk'
      });
    }

    res.status(201).json(newInspection);
  } catch (error) {
    res.status(500).json({ message: 'Failed to save inspection.', error: error.message });
  }
});

app.get('/api/inspections', protect, async (req, res) => {
  try {
    const list = await db.Inspection.find();
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching inspections list.' });
  }
});

app.get('/api/inspections/:id', protect, async (req, res) => {
  try {
    const inspection = await db.Inspection.findOne({ inspectionId: req.params.id });
    if (!inspection) return res.status(404).json({ message: 'Inspection not found.' });
    res.json(inspection);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving inspection details.' });
  }
});

// Catalog products
app.get('/api/products', protect, async (req, res) => {
  try {
    const list = await db.Product.find();
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving catalog.' });
  }
});

// Companies
app.get('/api/companies', protect, async (req, res) => {
  try {
    const list = await db.Company.find();
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving company registry.' });
  }
});

// PDF Report Download
app.get('/api/reports/:inspectionId', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || req.query.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer')) {
      return res.status(401).json({ message: 'Unauthorized report access.' });
    }

    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET);

    const inspection = await db.Inspection.findOne({ inspectionId: req.params.inspectionId });
    if (!inspection) return res.status(404).json({ message: 'Inspection report not found.' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=LabelGuard_Report_${inspection.inspectionId}.pdf`);

    generateInspectionPDF(inspection, res);
  } catch (error) {
    res.status(500).json({ message: 'PDF creation failed.', error: error.message });
  }
});

// Attempt database connection
console.log('GEMINI_API_KEY configured:', process.env.GEMINI_API_KEY ? 'YES' : 'NO');
mongoose.connect(mongoUri)
  .then(() => {
    console.log('MongoDB connected. Initializing server...');
    app.listen(PORT, () => console.log(`LabelGuard Server running on port ${PORT}`));
  })
  .catch(async (err) => {
    console.log('--- WARNING: DATABASE UNAVAILABLE ---');
    console.log('Starting in In-Memory Database Mode for local demo / offline execution.');
    isInMemoryMode = true;
    await seedMemoryDb();
    app.listen(PORT, () => console.log(`LabelGuard (In-Memory Fallback) running on port ${PORT}`));
  });
