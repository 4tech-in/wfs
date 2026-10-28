export interface ElectricityBillMetadata {
  accountName: string;
  accountNumber: string;
  billDate?: string;
  dueDate?: string;
  billFrom?: string;
  billTo?: string;
  months?: string;
  connectedLoad?: string;
  contractDemand?: string;
  billPeriod?: string;
  oldReadingKwh?: string;
  newReadingKwh?: string;
  oldReadingKvah?: string;
  newReadingKvah?: string;
  unitKwh?: string;
  unitKvah?: string;
  kwhKvahDiff?: string;
  kwhKvahRatio?: string;
  unitPriceBasic?: string;
  consumptionCharges?: string;
  fppca?: string;
  ed?: string;
  edRate?: string;
  fixedCharges?: string;
  mcTaxRate?: string;
  mcTax?: string;
  pfIncentive?: string;
  regSurcharge?: string;
  paymentRebate?: string;
  sundryCharges?: string;
  arrears?: string;
  reversalOfArrear?: string;
  totalAmount?: string;
  adjPrevBill?: string;
  acdInt?: string;
  acd?: string;
  lastAcd?: string;
  paidAmount?: string;
  paidOn?: string;
  paidUnitRate?: string;
  remarks?: string;
  [key: string]: unknown;
}

export interface ElectricityBillRecord {
  _id: string;
  title: string;
  documentType: "Electricity";
  files: string[];
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  metadata: ElectricityBillMetadata;
  createdAt: string;
  updatedAt: string;
}
