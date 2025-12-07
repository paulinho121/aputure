import { Part, Client, ServiceOrder, OrderStatus } from '../types';

export const MOCK_PARTS: Part[] = [
  {
    id: 'p1',
    name: 'COB Chip LS 600d Pro',
    code: 'APT-600D-COB',
    category: 'LED Engine',
    quantity: 4,
    minStock: 5,
    price: 1200.00,
    location: 'A1-02',
    imageUrl: 'https://picsum.photos/100/100?random=1'
  },
  {
    id: 'p2',
    name: 'Ventoinha Principal Nova P300c',
    code: 'APT-NOVA-FAN',
    category: 'Cooling',
    quantity: 12,
    minStock: 3,
    price: 150.00,
    location: 'B2-05',
    imageUrl: 'https://picsum.photos/100/100?random=2'
  },
  {
    id: 'p3',
    name: 'Placa Fonte 300x',
    code: 'APT-300X-PSU',
    category: 'Power Supply',
    quantity: 1,
    minStock: 2,
    price: 450.00,
    location: 'C1-10',
    imageUrl: 'https://picsum.photos/100/100?random=3'
  },
  {
    id: 'p4',
    name: 'Yoke Handle Assembly 1200d',
    code: 'APT-1200-YOKE',
    category: 'Hardware',
    quantity: 8,
    minStock: 2,
    price: 320.00,
    location: 'D4-01',
    imageUrl: 'https://picsum.photos/100/100?random=4'
  }
];

export const MOCK_CLIENTS: Client[] = [
  {
    id: 'c1',
    name: 'Locadora CineLuz',
    document: '12.345.678/0001-90',
    email: 'contato@cineluz.com.br',
    phone: '(11) 98888-7777',
    address: 'Rua da Produção, 100 - São Paulo, SP',
    notes: 'Cliente VIP, atendimento prioritário.'
  },
  {
    id: 'c2',
    name: 'João Silva Filmmaker',
    document: '123.456.789-00',
    email: 'joao@silva.com',
    phone: '(21) 99999-1234',
    address: 'Av. Copacabana, 500 - Rio de Janeiro, RJ'
  }
];

export const MOCK_ORDERS: ServiceOrder[] = [
  {
    id: 'OS-2023-001',
    clientId: 'c1',
    model: 'LS 600d Pro',
    serialNumber: 'SN8392842',
    condition: 'Marcas de uso intensas, lente frontal suja.',
    faultDescription: 'Não liga. Led de status pisca vermelho.',
    accessories: ['Case', 'Cabo AC', 'Control Box'],
    entryDate: '2023-10-25T10:00:00Z',
    status: OrderStatus.WAITING_APPROVAL,
    items: [
      { partId: 'p1', quantity: 1, unitPrice: 1200.00 }
    ],
    laborCost: 400.00,
    photos: []
  },
  {
    id: 'OS-2023-002',
    clientId: 'c2',
    model: 'Amaran 200x',
    serialNumber: 'SN112233',
    condition: 'Bom estado.',
    faultDescription: 'Cooler fazendo barulho excessivo.',
    accessories: ['Fonte'],
    entryDate: '2023-10-26T14:30:00Z',
    status: OrderStatus.PENDING,
    items: [],
    laborCost: 0,
    photos: []
  },
  {
    id: 'OS-2023-003',
    clientId: 'c1',
    model: 'Nova P600c',
    serialNumber: 'SN998877',
    condition: 'Novo.',
    faultDescription: 'Painel LCD quebrado.',
    accessories: ['Case', 'Cabos'],
    entryDate: '2023-10-27T09:00:00Z',
    status: OrderStatus.DIAGNOSING,
    items: [],
    laborCost: 0,
    photos: []
  }
];