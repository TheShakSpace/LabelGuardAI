const mongoose = require('mongoose');

// User Schema
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  inspectorId: { type: String, required: true, unique: true },
  role: { type: String, enum: ['INSPECTOR', 'OFFICIAL', 'ADMIN'], default: 'INSPECTOR' },
  createdAt: { type: Date, default: Date.now }
});

// Company Schema
const CompanySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  productsCount: { type: Number, default: 0 },
  inspectionsCount: { type: Number, default: 0 },
  violationsCount: { type: Number, default: 0 },
  averageScore: { type: Number, default: 100 },
  repeatIssues: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

// Product Schema
const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  company: { type: String, required: true }, // Name of the company
  brand: { type: String },
  category: { type: String, required: true },
  inspectionsCount: { type: Number, default: 0 },
  averageScore: { type: Number, default: 100 },
  lastInspectionDate: { type: Date },
  violationCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

// Declaration field sub-schema
const FieldSchema = new mongoose.Schema({
  value: { type: String, default: '' },
  status: { type: String, enum: ['Detected', 'Missing', 'Low Confidence', 'Conflict', 'Not Applicable'], default: 'Missing' },
  confidence: { type: Number, default: 0 },
  source: { type: String, default: '' }, // frontLabel, backLabel, etc.
  region: { type: [Number], default: null } // Bounding box: [x, y, w, h]
}, { _id: false });

// Inspection Schema
const InspectionSchema = new mongoose.Schema({
  inspectionId: { type: String, required: true, unique: true },
  productId: { type: String },
  companyId: { type: String },
  product: { type: String, required: true },
  company: { type: String, required: true },
  category: { type: String, required: true },
  images: {
    frontLabel: { type: String },
    backLabel: { type: String },
    additional: { type: String }
  },
  ocrText: { type: String, default: '' },
  declarations: {
    productName: { type: FieldSchema, default: () => ({}) },
    genericName: { type: FieldSchema, default: () => ({}) },
    mrp: { type: FieldSchema, default: () => ({}) },
    netQuantity: { type: FieldSchema, default: () => ({}) },
    manufacturerName: { type: FieldSchema, default: () => ({}) },
    manufacturerAddress: { type: FieldSchema, default: () => ({}) },
    packerDetails: { type: FieldSchema, default: () => ({}) },
    importerDetails: { type: FieldSchema, default: () => ({}) },
    countryOfOrigin: { type: FieldSchema, default: () => ({}) },
    consumerCare: { type: FieldSchema, default: () => ({}) },
    manufacturingDate: { type: FieldSchema, default: () => ({}) },
    packagingDate: { type: FieldSchema, default: () => ({}) },
    expiryDate: { type: FieldSchema, default: () => ({}) },
    batchNumber: { type: FieldSchema, default: () => ({}) }
  },
  qualityMetrics: {
    resolutionScore: { type: Number, default: 0 },
    blurScore: { type: Number, default: 0 },
    brightness: { type: Number, default: 0 },
    contrast: { type: Number, default: 0 },
    score: { type: Number, default: 0 }
  },
  checks: [{
    field: { type: String },
    status: { type: String, enum: ['PASS', 'WARNING', 'VIOLATION', 'NOT_APPLICABLE', 'REVIEW'] },
    severity: { type: String, enum: ['high', 'medium', 'low'] },
    confidence: { type: Number },
    ruleId: { type: String },
    reason: { type: String },
    evidence: {
      boundingBox: [Number],
      text: { type: String },
      imageType: { type: String }
    }
  }],
  violations: [{
    field: { type: String },
    ruleId: { type: String },
    severity: { type: String },
    reason: { type: String }
  }],
  score: { type: Number, default: 0 },
  status: { type: String, enum: ['COMPLIANT', 'REVIEW REQUIRED', 'NON-COMPLIANT'], default: 'REVIEW REQUIRED' },
  riskLevel: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM' },
  inspector: { type: String, required: true },
  location: { type: String, default: 'Delhi, India' },
  notes: { type: String, default: '' },
  auditTrail: [{
    timestamp: { type: Date, default: Date.now },
    user: { type: String },
    action: { type: String },
    details: { type: String }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Rule Schema
const RuleSchema = new mongoose.Schema({
  ruleId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  category: { type: String, required: true }, // e.g. "Food Products", "Cosmetics"
  field: { type: String, required: true },
  requirement: { type: String, required: true },
  validationType: { type: String, required: true }, // e.g. "required", "format"
  severity: { type: String, enum: ['high', 'medium', 'low'], required: true },
  description: { type: String },
  version: { type: String, default: 'prototype-1' },
  sourceReference: { type: String, default: 'Legal Metrology Rules, 2011' },
  active: { type: Boolean, default: true }
});

// Notification Schema
const NotificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  type: { type: String, default: 'info' }, // 'info', 'warning', 'violation', 'risk'
  createdAt: { type: Date, default: Date.now }
});

module.exports = {
  User: mongoose.model('User', UserSchema),
  Company: mongoose.model('Company', CompanySchema),
  Product: mongoose.model('Product', ProductSchema),
  Inspection: mongoose.model('Inspection', InspectionSchema),
  Rule: mongoose.model('Rule', RuleSchema),
  Notification: mongoose.model('Notification', NotificationSchema)
};
