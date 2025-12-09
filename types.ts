export enum OrderStatus {
  PENDING = 'Recebido',
  DIAGNOSING = 'Em Análise',
  WAITING_APPROVAL = 'Aguardando Aprovação',
  IN_REPAIR = 'Em Reparo',
  COMPLETED = 'Pronto',
  DELIVERED = 'Entregue'
}

export interface Part {
  id: string;
  name: string;
  code: string;
  category: string;
  quantity: number;
  minStock: number;
  price: number;
  location: string;
  imageUrl?: string;
  manufacturer?: 'Aputure' | 'Astera' | 'Cream Source';
}

export interface AsteraPart extends Part {
  unitsPerPackage: number;
}

export interface CreamSourcePart extends Part {
  unitsPerPackage: number;
}

export interface Client {
  id: string;
  name: string;
  document: string; // CPF or CNPJ
  email: string;
  phone: string;
  address: string;
  zipCode?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  notes?: string;
}

export interface ServiceOrderItem {
  partId: string;
  quantity: number;
  unitPrice: number;
}

export interface ServiceOrder {
  id: string;
  clientId: string;
  model: string;
  serialNumber: string;
  condition: string;
  faultDescription: string;
  accessories: string[];
  entryDate: string;
  status: OrderStatus;
  serviceType: 'Paid' | 'Warranty';
  items: ServiceOrderItem[]; // Used for quotes
  laborCost: number;
  laborDescription?: string; // Description of labor/service to be performed
  shippingMethod?: string;
  shippingCost?: number;
  discount?: number;
  photos: string[];
  paymentMethod?: string;
  paymentProofUrl?: string;
  invoiceNumber?: string;
  technicalReport?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'tech';
}