export interface BusinessDetails {
  shopName: string;
  shopAddress: string;
  holderName?: string;
  mobile?: string;
  logo?: string;
  gstNumber?: string;
  stampImage?: string;
  signatureImage?: string;
  useAutoStamp?: boolean;
  stampBusinessName?: string;
  stampLocation?: string;
  generatedStampImage?: string;
}

export interface BillItem {
  id: string;
  name: string;
  quantity: number;
  rate: number;
  total: number;
}

export interface Bill {
  id: string;
  billNumber: string;
  customerName: string;
  billDate: string;
  items: BillItem[];
  subtotal: number;
  gstEnabled: boolean;
  gstPercentage: number;
  gstAmount: number;
  grandTotal: number;
  templateId: string;
  createdAt: string;
}

export interface BillTemplate {
  id: string;
  name: string;
  description: string;
  preview: string;
}

export const TEMPLATES: BillTemplate[] = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional professional invoice design',
    preview: 'classic'
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Clean minimalist contemporary style',
    preview: 'modern'
  },
  {
    id: 'elegant',
    name: 'Elegant',
    description: 'Sophisticated premium look',
    preview: 'elegant'
  }
];
