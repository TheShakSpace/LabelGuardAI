// LabelGuard AI - Machine-Readable Legal Metrology Rules
// NOTE: Prototype rule set — subject to regulatory/domain validation.

const rules = [
  {
    ruleId: "LM-PC-NAME-01",
    title: "Common/Generic Name Declaration",
    category: "Food Products",
    field: "genericName",
    requirement: "Common or generic name of the commodity must be declared on the package.",
    validationType: "required",
    severity: "high",
    description: "Every package shall bear thereon the common or generic name of the commodity contained therein.",
    version: "prototype-1",
    sourceReference: "Rule 6(1)(a) of Legal Metrology (Packaged Commodities) Rules, 2011",
    active: true
  },
  {
    ruleId: "LM-PC-MFR-02",
    title: "Manufacturer/Packer Details",
    category: "Food Products",
    field: "manufacturerName",
    requirement: "Name and complete address of the manufacturer/packer/importer must be declared.",
    validationType: "required",
    severity: "high",
    description: "Every package must bear the name and complete address of the manufacturer, packer or importer.",
    version: "prototype-1",
    sourceReference: "Rule 6(1)(b) of Legal Metrology (Packaged Commodities) Rules, 2011",
    active: true
  },
  {
    ruleId: "LM-PC-QTY-03",
    title: "Net Quantity Declaration",
    category: "Food Products",
    field: "netQuantity",
    requirement: "Net quantity in terms of standard unit of weight, measure or number must be declared.",
    validationType: "required",
    severity: "high",
    description: "Net quantity must be declared using standard units of weight, measure, or number.",
    version: "prototype-1",
    sourceReference: "Rule 6(1)(c) of Legal Metrology (Packaged Commodities) Rules, 2011",
    active: true
  },
  {
    ruleId: "LM-PC-MFG-04",
    title: "Month and Year of Manufacture",
    category: "Food Products",
    field: "manufacturingDate",
    requirement: "Month and year of manufacture, packing or import must be clearly declared.",
    validationType: "required",
    severity: "medium",
    description: "The month and year of manufacture or pre-packing or import must be declared on the label.",
    version: "prototype-1",
    sourceReference: "Rule 6(1)(d) of Legal Metrology (Packaged Commodities) Rules, 2011",
    active: true
  },
  {
    ruleId: "LM-PC-MRP-05",
    title: "Maximum Retail Price (MRP) Declaration",
    category: "Food Products",
    field: "mrp",
    requirement: "Retail sale price of the package must be declared as 'MRP Rs / ₹ ... (inclusive of all taxes)'.",
    validationType: "required",
    severity: "high",
    description: "MRP declaration must include the price along with text 'inclusive of all taxes'.",
    version: "prototype-1",
    sourceReference: "Rule 6(1)(e) of Legal Metrology (Packaged Commodities) Rules, 2011",
    active: true
  },
  {
    ruleId: "LM-PC-CC-06",
    title: "Consumer Care Details",
    category: "Food Products",
    field: "consumerCare",
    requirement: "Consumer care details (name, address, phone number, and email ID) must be declared.",
    validationType: "required",
    severity: "high",
    description: "Every package must bear the consumer care details including contact phone and email.",
    version: "prototype-1",
    sourceReference: "Rule 6(1)(g) of Legal Metrology (Packaged Commodities) Rules, 2011",
    active: true
  },
  {
    ruleId: "LM-PC-COI-07",
    title: "Country of Origin",
    category: "Food Products",
    field: "countryOfOrigin",
    requirement: "Country of origin must be declared on imported packages, or generally declared.",
    validationType: "required",
    severity: "medium",
    description: "Name of the country of origin must be clearly declared on the label.",
    version: "prototype-1",
    sourceReference: "Rule 6(1)(aa) of Legal Metrology (Packaged Commodities) Rules, 2011",
    active: true
  },

  // COSMETICS RULES
  {
    ruleId: "LM-PC-COS-NAME",
    title: "Cosmetic Commodity Name",
    category: "Cosmetics",
    field: "genericName",
    requirement: "Common name of the cosmetic commodity must be clearly declared.",
    validationType: "required",
    severity: "high",
    description: "Common name declaration is mandatory for cosmetics.",
    version: "prototype-1",
    sourceReference: "Rule 6(1)(a) of Legal Metrology Rules, 2011",
    active: true
  },
  {
    ruleId: "LM-PC-COS-MRP",
    title: "Cosmetic Retail Price",
    category: "Cosmetics",
    field: "mrp",
    requirement: "Maximum Retail Price (MRP) inclusive of all taxes must be declared.",
    validationType: "required",
    severity: "high",
    description: "MRP inclusive of all taxes is required on cosmetics packages.",
    version: "prototype-1",
    sourceReference: "Rule 6(1)(e) of Legal Metrology Rules, 2011",
    active: true
  },

  // HOUSEHOLD GOODS RULES
  {
    ruleId: "LM-PC-HH-NAME",
    title: "Household Commodity Name",
    category: "Household Goods",
    field: "genericName",
    requirement: "Common name of the household commodity must be clearly declared.",
    validationType: "required",
    severity: "high",
    description: "Common generic name declaration is mandatory for household packaged commodities.",
    version: "prototype-1",
    sourceReference: "Rule 6(1)(a) of Legal Metrology Rules, 2011",
    active: true
  },
  {
    ruleId: "LM-PC-HH-MRP",
    title: "Household Package Price",
    category: "Household Goods",
    field: "mrp",
    requirement: "Maximum Retail Price (MRP) inclusive of all taxes must be declared.",
    validationType: "required",
    severity: "high",
    description: "MRP inclusive of all taxes is required on household commodity packages.",
    version: "prototype-1",
    sourceReference: "Rule 6(1)(e) of Legal Metrology Rules, 2011",
    active: true
  }
];

module.exports = rules;
