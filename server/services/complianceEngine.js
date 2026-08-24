const rules = require('../rules/rules');

// Helper to normalize MRP string to numeric value
function normalizeMRP(mrpStr) {
  if (!mrpStr) return null;
  // Extract number like 50 or 50.00 or 1500
  const match = mrpStr.replace(/,/g, '').match(/(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : null;
}

// Helper to normalize net quantity string
function normalizeQuantity(qtyStr) {
  if (!qtyStr) return null;
  const match = qtyStr.toLowerCase().match(/(\d+(?:\.\d+)?)\s*(g|kg|ml|l|gm|ltr|kg\.|g\.|ml\.|l\.|units|pcs|number|n|u)/);
  if (!match) return null;
  const value = parseFloat(match[1]);
  let unit = match[2];
  if (unit === 'gm' || unit === 'g.') unit = 'g';
  if (unit === 'ltr' || unit === 'l.') unit = 'l';
  if (unit === 'kg.') unit = 'kg';
  if (unit === 'ml.') unit = 'ml';
  return { value, unit };
}

// Helper to normalize dates (returns date string or null)
function normalizeDate(dateStr) {
  if (!dateStr) return null;
  // Match formats like MM/YYYY, MM-YYYY, MM/YY, DD/MM/YYYY
  const match = dateStr.match(/(\d{1,2})[\/\-](\d{2,4})/);
  if (match) {
    let month = parseInt(match[1]);
    let year = parseInt(match[2]);
    if (year < 100) year += 2000;
    if (month >= 1 && month <= 12) {
      return `${String(month).padStart(2, '0')}/${year}`;
    }
  }
  return dateStr;
}

function runComplianceCheck(declarations, category, activeRulesList = null) {
  const currentRules = activeRulesList || rules;
  const applicableRules = currentRules.filter(r => r.active && (r.category === category || r.category === 'Food Products'));
  
  const checks = [];
  const violations = [];
  const reasons = [];
  let conflictDetected = false;

  // 1. Normalization & Preprocessing of declarations
  const normDecls = { ...declarations };

  // Normalize MRP
  if (normDecls.mrp && normDecls.mrp.value) {
    const numericMRP = normalizeMRP(normDecls.mrp.value);
    if (numericMRP) {
      normDecls.mrp.normalizedValue = `₹${numericMRP.toFixed(2)}`;
    }
  }

  // Normalize Net Quantity
  if (normDecls.netQuantity && normDecls.netQuantity.value) {
    const parsedQty = normalizeQuantity(normDecls.netQuantity.value);
    if (parsedQty) {
      normDecls.netQuantity.normalizedValue = `${parsedQty.value} ${parsedQty.unit}`;
    }
  }

  // Normalize Manufacturing Date
  if (normDecls.manufacturingDate && normDecls.manufacturingDate.value) {
    const formattedDate = normalizeDate(normDecls.manufacturingDate.value);
    if (formattedDate) {
      normDecls.manufacturingDate.normalizedValue = formattedDate;
    }
  }

  // 2. Conflict Detection
  // Simulate checking for duplicate text blocks in raw OCR that suggest conflicting values
  if (declarations.mrp && declarations.mrp.value) {
    // E.g. Check if value contains multiple price matches (like "MRP Rs 50" and "Rs 55")
    const priceMatches = declarations.mrp.value.match(/(?:Rs\.?|₹)\s*\d+/gi);
    if (priceMatches && new Set(priceMatches.map(p => p.replace(/\s+/g, '').toLowerCase())).size > 1) {
      conflictDetected = true;
      normDecls.mrp.status = 'Conflict';
      reasons.push('Conflicting MRP declarations detected on package panel (multiple price markers).');
    }
  }

  if (declarations.netQuantity && declarations.netQuantity.value) {
    const qtyMatches = declarations.netQuantity.value.match(/\d+\s*(?:g|kg|ml|l|gm)/gi);
    if (qtyMatches && new Set(qtyMatches.map(q => q.replace(/\s+/g, '').toLowerCase())).size > 1) {
      conflictDetected = true;
      normDecls.netQuantity.status = 'Conflict';
      reasons.push('Conflicting net quantity markers detected on panel.');
    }
  }

  // 3. Apply deterministic Rules Engine validations
  applicableRules.forEach(rule => {
    const targetField = rule.field;
    const decl = normDecls[targetField];
    let detected = decl && decl.status !== 'Missing' && decl.value.trim() !== '';

    if (detected) {
      let status = 'PASS';
      let reason = 'Declaration successfully detected and verified.';
      let confidence = decl.confidence || 90;

      // Special field checks
      if (rule.ruleId === 'LM-PC-MRP-05') {
        const valLower = decl.value.toLowerCase();
        if (!valLower.includes('mrp') && !valLower.includes('retail') && !valLower.includes('price')) {
          status = 'WARNING';
          reason = 'MRP declared, but lacks standard words like "Max Retail Price" or "MRP".';
        } else if (!valLower.includes('inclusive') && !valLower.includes('tax')) {
          status = 'WARNING';
          reason = 'MRP declared, but lacks required "inclusive of all taxes" text.';
        }
      }

      if (decl.status === 'Conflict') {
        status = 'REVIEW';
        reason = 'Field has conflicting declarations on the label.';
      } else if (decl.confidence < 70) {
        status = 'REVIEW';
        reason = `Field detected with low confidence (${decl.confidence}%).`;
      }

      checks.push({
        field: targetField,
        status: status,
        severity: rule.severity,
        confidence: confidence,
        ruleId: rule.ruleId,
        reason: reason,
        evidence: {
          boundingBox: decl.region || getEvidenceCoordinates(targetField),
          text: decl.value,
          imageType: targetField === 'productName' || targetField === 'genericName' ? 'frontLabel' : 'backLabel'
        }
      });

      if (status === 'WARNING' || status === 'REVIEW') {
        violations.push({
          field: targetField,
          ruleId: rule.ruleId,
          severity: 'low',
          reason: reason
        });
      }
    } else {
      // Missing field validation
      checks.push({
        field: targetField,
        status: 'VIOLATION',
        severity: rule.severity,
        confidence: 0,
        ruleId: rule.ruleId,
        reason: `Required declaration "${rule.title}" not detected.`,
        evidence: {
          boundingBox: null,
          text: '',
          imageType: 'backLabel'
        }
      });

      violations.push({
        field: targetField,
        ruleId: rule.ruleId,
        severity: rule.severity,
        reason: `Required declaration "${rule.title}" not detected.`
      });
    }
  });

  // 4. Compliance Scoring
  const totalChecks = checks.length;
  const passedChecks = checks.filter(c => c.status === 'PASS').length;
  const warningChecks = checks.filter(c => c.status === 'WARNING').length;
  const reviewChecks = checks.filter(c => c.status === 'REVIEW').length;

  const totalPointsPossible = totalChecks * 10;
  const pointsScored = (passedChecks * 10) + (warningChecks * 5) + (reviewChecks * 5);
  const score = totalChecks > 0 ? Math.round((pointsScored / totalPointsPossible) * 100) : 100;

  let complianceStatus = 'REVIEW REQUIRED';
  if (score >= 90) {
    complianceStatus = 'COMPLIANT';
  } else if (score < 50) {
    complianceStatus = 'NON-COMPLIANT';
  }

  // 5. Risk Ranking Engine
  let riskLevel = 'LOW';
  const highSeverityViolations = violations.filter(v => v.severity === 'high').length;
  const mediumSeverityViolations = violations.filter(v => v.severity === 'medium').length;

  if (highSeverityViolations > 0 || conflictDetected || score < 60) {
    riskLevel = 'HIGH';
  } else if (mediumSeverityViolations > 0 || violations.length > 1 || score < 85) {
    riskLevel = 'MEDIUM';
  }

  // Generate explainable risk reasons list
  if (highSeverityViolations > 0) {
    reasons.push(`${highSeverityViolations} high-severity violations detected.`);
  }
  if (mediumSeverityViolations > 0) {
    reasons.push(`${mediumSeverityViolations} medium-severity violations detected.`);
  }
  if (conflictDetected) {
    reasons.push('Conflicting declarations present on label.');
  }
  if (score < 70) {
    reasons.push(`Low overall compliance score (${score}/100).`);
  }
  if (reasons.length === 0) {
    reasons.push('No significant compliance or quality issues observed.');
  }

  return {
    checks,
    violations,
    score,
    status: complianceStatus,
    riskLevel,
    riskReasons: reasons,
    declarations: normDecls
  };
}

// Bounding box mock coordinates
function getEvidenceCoordinates(field) {
  const coords = {
    productName: [120, 150, 400, 80],
    genericName: [120, 240, 300, 40],
    mrp: [40, 520, 200, 40],
    netQuantity: [40, 570, 180, 40],
    manufacturerName: [40, 620, 350, 30],
    manufacturerAddress: [40, 650, 350, 60],
    consumerCare: [40, 720, 400, 70],
    manufacturingDate: [40, 470, 220, 40],
    countryOfOrigin: [40, 320, 180, 30]
  };
  return coords[field] || [50, 50, 200, 50];
}

module.exports = { runComplianceCheck };
