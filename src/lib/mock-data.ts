import { Customer, Invoice } from './types'

export const mockCustomers: Customer[] = [
  {
    id: 'cust-001', name: 'Amina Diallo', email: 'amina.diallo@techdakar.sn',
    phone: '+221 77 123 45 67', company: 'Tech Dakar SARL',
    address: '12 Avenue Cheikh Anta Diop, Dakar', avatarSeed: 'Amina',
    totalInvoices: 8, totalAmount: 1240000, createdAt: '2024-09-10',
  },
  {
    id: 'cust-002', name: 'Kofi Mensah', email: 'kofi.mensah@lometech.tg',
    phone: '+228 90 12 34 56', company: 'Lomé Tech Solutions',
    address: '45 Rue du Commerce, Lomé', avatarSeed: 'Kofi',
    totalInvoices: 12, totalAmount: 2850000, createdAt: '2024-07-15',
  },
  {
    id: 'cust-003', name: 'Fatoumata Traoré', email: 'f.traore@abidjangroup.ci',
    phone: '+225 07 45 67 89', company: 'Abidjan Group SARL',
    address: '8 Bd de la République, Abidjan', avatarSeed: 'Fatoumata',
    totalInvoices: 5, totalAmount: 675000, createdAt: '2024-11-03',
  },
  {
    id: 'cust-004', name: 'Sébastien Akakpo', email: 'sakakpo@cotonoudigital.bj',
    phone: '+229 97 23 45 67', company: 'Cotonou Digital',
    address: '3 Rue des Palmiers, Cotonou', avatarSeed: 'Sebastien',
    totalInvoices: 15, totalAmount: 3200000, createdAt: '2024-06-20',
  },
  {
    id: 'cust-005', name: 'Awa Coulibaly', email: 'awa.coulibaly@bfaso-invest.bf',
    phone: '+226 70 34 56 78', company: 'BFaso Investissement',
    address: '17 Avenue Kwame Nkrumah, Ouagadougou', avatarSeed: 'Awa',
    totalInvoices: 3, totalAmount: 420000, createdAt: '2025-01-08',
  },
  {
    id: 'cust-006', name: 'Mamadou Barry', email: 'm.barry@guineaservices.gn',
    phone: '+224 622 12 34 56', company: 'Guinea Services',
    address: '22 Rue Tombo, Conakry', avatarSeed: 'Mamadou',
    totalInvoices: 7, totalAmount: 980000, createdAt: '2024-10-12',
  },
  {
    id: 'cust-007', name: 'Clarisse Adjobi', email: 'c.adjobi@lokotech.tg',
    phone: '+228 91 23 45 67', company: 'Loko Technologies',
    address: '9 Avenue Sarakawa, Lomé', avatarSeed: 'Clarisse',
    totalInvoices: 4, totalAmount: 560000, createdAt: '2024-12-01',
  },
  {
    id: 'cust-008', name: 'Ibrahim Sawadogo', email: 'i.sawadogo@sahelconsult.bf',
    phone: '+226 71 45 67 89', company: 'Sahel Consulting',
    address: '5 Rue du Mogho Naaba, Ouagadougou', avatarSeed: 'Ibrahim',
    totalInvoices: 9, totalAmount: 1450000, createdAt: '2024-08-25',
  },
  {
    id: 'cust-009', name: 'Nathalie Kouassi', email: 'n.kouassi@cocody-pro.ci',
    phone: '+225 05 67 89 01', company: 'Cocody Professionals',
    address: '34 Rue des Jardins, Cocody', avatarSeed: 'Nathalie',
    totalInvoices: 6, totalAmount: 890000, createdAt: '2024-09-30',
  },
  {
    id: 'cust-010', name: 'Emmanuel Hounkpe', email: 'e.hounkpe@parakou-biz.bj',
    phone: '+229 95 34 56 78', company: 'Parakou Business',
    address: "11 Avenue de l'Atacora, Parakou", avatarSeed: 'Emmanuel',
    totalInvoices: 2, totalAmount: 180000, createdAt: '2025-02-14',
  },
  {
    id: 'cust-011', name: 'Rokia Sangaré', email: 'r.sangare@bamakosolutions.ml',
    phone: '+223 76 12 34 56', company: 'Bamako Solutions',
    address: '6 Rue Baba Diarra, Bamako', avatarSeed: 'Rokia',
    totalInvoices: 11, totalAmount: 1780000, createdAt: '2024-07-01',
  },
  {
    id: 'cust-012', name: 'Yao Agbéko', email: 'y.agbeko@kpalime-services.tg',
    phone: '+228 92 56 78 90', company: 'Kpalimé Services',
    address: '2 Rue du Marché, Kpalimé', avatarSeed: 'Yao',
    totalInvoices: 1, totalAmount: 85000, createdAt: '2025-03-20',
  },
]

function inv(
  id: string, customer: Customer,
  date: string, dueDate: string, subtotal: number,
  status: Invoice['status'], notes = '',
  items: Invoice['items'] = []
): Invoice {
  const taxRate = 18
  const tax = Math.round(subtotal * taxRate / 100)
  const amount = subtotal + tax
  return {
    id,
    customerId: customer.id,
    customerName: customer.name,
    customerCompany: customer.company,
    customerEmail: customer.email,
    customerPhone: customer.phone,
    customerAddress: customer.address,
    date, dueDate, subtotal, tax, taxRate, amount, status, notes, items,
  }
}

const c = (id: string) => mockCustomers.find((x) => x.id === id)!

export const mockInvoices: Invoice[] = [
  inv('INV-001', c('cust-001'), '2025-01-05', '2025-02-04', 350000, 'paid', '', [
    { description: 'Développement site web', quantity: 1, unitPrice: 250000, total: 250000 },
    { description: 'Hébergement annuel', quantity: 1, unitPrice: 100000, total: 100000 },
  ]),
  inv('INV-002', c('cust-002'), '2025-01-10', '2025-02-09', 520000, 'paid', '', [
    { description: 'Audit système', quantity: 1, unitPrice: 300000, total: 300000 },
    { description: 'Formation équipe', quantity: 2, unitPrice: 110000, total: 220000 },
  ]),
  inv('INV-003', c('cust-004'), '2025-01-18', '2025-02-17', 780000, 'overdue', '', [
    { description: 'Déploiement infrastructure cloud', quantity: 1, unitPrice: 500000, total: 500000 },
    { description: 'Support technique (3 mois)', quantity: 3, unitPrice: 93333, total: 280000 },
  ]),
  inv('INV-004', c('cust-011'), '2025-01-22', '2025-02-21', 195000, 'paid', '', [
    { description: 'Conseil stratégique', quantity: 5, unitPrice: 39000, total: 195000 },
  ]),
  inv('INV-005', c('cust-003'), '2025-02-01', '2025-03-03', 240000, 'paid', '', [
    { description: 'Design UI/UX', quantity: 1, unitPrice: 180000, total: 180000 },
    { description: 'Révisions', quantity: 3, unitPrice: 20000, total: 60000 },
  ]),
  inv('INV-006', c('cust-008'), '2025-02-05', '2025-03-07', 410000, 'overdue', '', [
    { description: 'Étude de marché', quantity: 1, unitPrice: 410000, total: 410000 },
  ]),
  inv('INV-007', c('cust-006'), '2025-02-12', '2025-03-14', 165000, 'paid', '', [
    { description: 'Maintenance applicative', quantity: 1, unitPrice: 165000, total: 165000 },
  ]),
  inv('INV-008', c('cust-002'), '2025-02-18', '2025-03-20', 630000, 'overdue', '', [
    { description: 'Migration base de données', quantity: 1, unitPrice: 400000, total: 400000 },
    { description: 'Tests et validation', quantity: 1, unitPrice: 230000, total: 230000 },
  ]),
  inv('INV-009', c('cust-009'), '2025-02-25', '2025-03-27', 285000, 'paid', '', [
    { description: 'Rédaction contenu web', quantity: 10, unitPrice: 28500, total: 285000 },
  ]),
  inv('INV-010', c('cust-004'), '2025-03-03', '2025-04-02', 920000, 'sent', '', [
    { description: 'Application mobile (Android)', quantity: 1, unitPrice: 600000, total: 600000 },
    { description: 'Application mobile (iOS)', quantity: 1, unitPrice: 320000, total: 320000 },
  ]),
  inv('INV-011', c('cust-005'), '2025-03-08', '2025-04-07', 142000, 'sent', '', [
    { description: 'Rapport financier Q1', quantity: 1, unitPrice: 142000, total: 142000 },
  ]),
  inv('INV-012', c('cust-007'), '2025-03-15', '2025-04-14', 375000, 'overdue', '', [
    { description: 'Intégration API paiement', quantity: 1, unitPrice: 250000, total: 250000 },
    { description: 'Documentation technique', quantity: 1, unitPrice: 125000, total: 125000 },
  ]),
  inv('INV-013', c('cust-001'), '2025-03-20', '2025-04-19', 215000, 'paid', '', [
    { description: 'SEO et référencement', quantity: 1, unitPrice: 215000, total: 215000 },
  ]),
  inv('INV-014', c('cust-011'), '2025-03-28', '2025-04-27', 480000, 'sent', '', [
    { description: 'Formation digital marketing', quantity: 1, unitPrice: 480000, total: 480000 },
  ]),
  inv('INV-015', c('cust-008'), '2025-04-02', '2025-05-02', 310000, 'sent', '', [
    { description: 'Consulting RH', quantity: 4, unitPrice: 77500, total: 310000 },
  ]),
  inv('INV-016', c('cust-006'), '2025-04-08', '2025-05-08', 190000, 'sent', '', [
    { description: 'Support niveau 2', quantity: 1, unitPrice: 190000, total: 190000 },
  ]),
  inv('INV-017', c('cust-009'), '2025-04-15', '2025-05-15', 255000, 'overdue', '', [
    { description: 'Gestion réseaux sociaux (1 mois)', quantity: 1, unitPrice: 255000, total: 255000 },
  ]),
  inv('INV-018', c('cust-012'), '2025-04-22', '2025-05-22', 85000, 'sent', '', [
    { description: 'Création logo et charte graphique', quantity: 1, unitPrice: 85000, total: 85000 },
  ]),
  inv('INV-019', c('cust-003'), '2025-04-28', '2025-05-28', 435000, 'draft', 'À valider avant envoi', [
    { description: 'Refonte e-commerce', quantity: 1, unitPrice: 350000, total: 350000 },
    { description: 'Module paiement mobile', quantity: 1, unitPrice: 85000, total: 85000 },
  ]),
  inv('INV-020', c('cust-010'), '2025-05-05', '2025-06-04', 180000, 'draft', '', [
    { description: 'Audit sécurité web', quantity: 1, unitPrice: 180000, total: 180000 },
  ]),
]
