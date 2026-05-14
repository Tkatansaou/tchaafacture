# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Ce que fait l'application

**mouFacture** est un SaaS de facturation en ligne destiné aux PME d'Afrique. Il permet de créer et gérer des factures et des devis, de suivre les paiements, d'envoyer des factures par email avec PDF en pièce jointe, et de suivre les revenus via un tableau de bord. C'est une application **full-stack multi-tenant** : chaque utilisateur a ses propres données, isolées par Row Level Security dans Supabase. La devise principale est le Franc CFA (XOF).

L'application dispose d'une **landing page publique** sur `/` (accessible sans connexion) et d'un **tableau de bord** sur `/dashboard` (protégé par auth).

## Commandes

```bash
npm run dev      # Serveur de développement sur http://localhost:3000
npm run build    # Build de production (vérifie TypeScript + ESLint)
npm run lint     # Lint ESLint uniquement
npm run start    # Serveur de production (après build)
```

> Pas de tests automatisés dans ce projet.

## Architecture

### Stack

- **Next.js 14** (App Router) — pages dans `src/app/`
- **TypeScript** strict
- **Tailwind CSS** — design system via variables CSS HSL dans `globals.css`
- **Recharts** — graphique des revenus mensuels
- **lucide-react** — icônes
- **class-variance-authority + clsx + tailwind-merge** — variants de composants UI
- **Supabase** — PostgreSQL + Auth + Row Level Security (RLS)
- **`@supabase/ssr`** — gestion des sessions serveur/client
- **`@react-pdf/renderer`** — génération de PDF côté serveur (route API `/api/invoices/[id]/pdf`)
- **`resend`** — envoi d'emails transactionnels avec PDF en pièce jointe

### Variables d'environnement (`.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=https://rbefcjhfzwreoqtjbols.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<clé anon>
RESEND_API_KEY=<clé Resend pour l'envoi d'emails>
```

Ces variables sont également configurées sur Vercel (production + preview + development).

### Structure des données (`src/lib/`)

| Fichier | Rôle |
|---|---|
| `types.ts` | Interfaces TypeScript partagées (`Invoice`, `Customer`, `CompanySettings`, `Quote`, `Payment`, etc.) |
| `formatters.ts` | `formatCurrency(n)` → XOF via `Intl`, `formatDate(s)` → `Intl.DateTimeFormat` fr-FR |
| `utils.ts` | Utilitaire `cn()` pour fusionner les classes Tailwind |
| `supabase/client.ts` | Client navigateur (`createBrowserClient`) |
| `supabase/server.ts` | Client serveur (`createServerClient` avec cookies Next.js) |
| `supabase/middleware.ts` | `updateSession()` — rafraîchit le token à chaque requête |
| `pdf/invoice-pdf.tsx` | Template PDF de la facture (`@react-pdf/renderer`) |
| `email/invoice-email.tsx` | Template HTML de l'email de facture (inline CSS) |
| `i18n/translations.ts` | Traductions FR/EN complètes de toute l'interface |
| `i18n/context.tsx` | Contexte React `I18nProvider` + hook `useI18n()` — persistance localStorage |

> `store.ts` et `mock-data.ts` ont été supprimés — remplacés par les Server Actions.

### Server Actions (`src/lib/actions/`)

Toute interaction avec la base de données passe par ces Server Actions (`'use server'`). Elles vérifient systématiquement `supabase.auth.getUser()` avant toute requête.

| Fichier | Fonctions |
|---|---|
| `invoices.ts` | `getInvoices`, `getInvoice`, `createInvoice`, `updateInvoice`, `updateInvoiceStatus`, `deleteInvoice`, `nextInvoiceNumber` |
| `customers.ts` | `getCustomers` (avec stats agrégées), `createCustomer`, `updateCustomer`, `deleteCustomer` |
| `settings.ts` | `getSettings` (upsert au premier appel), `updateSettings` |
| `quotes.ts` | `getQuotes`, `getQuote`, `createQuote`, `updateQuote`, `updateQuoteStatus`, `deleteQuote`, `convertQuoteToInvoice` |
| `payments.ts` | `getPayments`, `addPayment`, `deletePayment` — recalcule le statut de la facture automatiquement |
| `email.ts` | `sendInvoiceEmail` — génère le PDF + envoie via Resend avec pièce jointe |

### Flux de données

Pattern validé sur toutes les pages interactives :
1. La page reste `'use client'`
2. `useEffect(() => { serverAction().then(setState) }, [])` pour le chargement initial
3. Les mutations appellent directement la Server Action, puis mettent à jour le state local optimiste

```typescript
// Exemple
useEffect(() => { getInvoices().then(setInvoices).catch(console.error) }, [])

const handleDelete = async (id: string) => {
  await deleteInvoice(id)
  setInvoices(prev => prev.filter(inv => inv.id !== id))
}
```

Ne pas convertir les pages en Server Components sauf si elles sont 100% statiques.

### Schéma base de données

6 tables dans Supabase, toutes protégées par RLS (`auth.uid() = user_id`) :

- **`company_settings`** — 1 ligne par utilisateur (upsert sur `user_id`)
- **`customers`** — clients de l'utilisateur
- **`invoices`** — factures (id = chaîne type `INV-021`)
- **`invoice_items`** — lignes de facture (FK → `invoices.id` ON DELETE CASCADE)
- **`quotes`** — devis (id = chaîne type `DEV-001`), avec `converted_to_invoice_id` pour tracer la conversion
- **`quote_items`** — lignes de devis (FK → `quotes.id` ON DELETE CASCADE)
- **`payments`** — paiements partiels (FK → `invoices.id` ON DELETE CASCADE), montants en entiers FCFA

Migrations :
- `supabase/migrations/001_initial_schema.sql` — schéma initial
- `supabase/migrations/002_add_tax_label.sql` — colonne `tax_label` sur `invoices`
- `supabase/migrations/003_add_quotes.sql` — tables `quotes` + `quote_items` + RLS
- `supabase/migrations/004_add_payments.sql` — table `payments` + RLS

### Numérotation des factures et devis

- `nextInvoiceNumber()` — préfixe depuis `company_settings.invoice_prefix` (ex. `INV-`) + compteur résistant aux suppressions
- Les devis utilisent le même préfixe avec `INV-` remplacé par `DEV-` (ex. `DEV-001`)

### Export PDF natif

Route API `GET /api/invoices/[id]/pdf` (runtime Node.js) :
1. Authentifie l'utilisateur via Supabase
2. Récupère la facture + les paramètres entreprise
3. Génère le PDF avec `@react-pdf/renderer` (`renderToBuffer`)
4. Retourne le fichier avec `Content-Type: application/pdf`

Le template PDF est dans `src/lib/pdf/invoice-pdf.tsx`. Utilise les polices built-in de `@react-pdf/renderer` (Helvetica, Courier). `next.config.mjs` inclut `transpilePackages: ['@react-pdf/renderer']`.

### Envoi d'email

`sendInvoiceEmail(invoiceId)` dans `src/lib/actions/email.ts` :
1. Vérifie que `RESEND_API_KEY` est définie
2. Génère le PDF via `renderToBuffer`
3. Compose l'email HTML via `invoiceEmailHtml()` de `src/lib/email/invoice-email.tsx`
4. Envoie via `resend.emails.send()` avec le PDF en pièce jointe
5. Retourne `{ success: boolean, error?: string }`

Le bouton "Email" n'apparaît sur la facture que si `invoice.customerEmail` est renseigné.

### Gestion des devis

Workflow complet : Brouillon → Envoyé → Accepté/Refusé/Expiré → (Converti en facture)

`convertQuoteToInvoice(quoteId)` :
1. Crée une facture avec les mêmes lignes et montants
2. Date = aujourd'hui, échéance = aujourd'hui + `paymentTerms` jours
3. Met à jour le devis : `status = 'accepted'`, `converted_to_invoice_id = invoice.id`
4. Redirige vers la nouvelle facture

### Paiements partiels

`addPayment()` :
1. Insère le paiement
2. Recalcule le total payé sur toutes les factures
3. Met automatiquement la facture à `'paid'` si `totalPaid >= invoice.amount`, sinon `'sent'`

`deletePayment()` fait le chemin inverse : repasse à `'sent'` si la facture n'est plus soldée.

### Internationalisation (i18n)

- Contexte React `I18nProvider` wrappé dans `src/app/layout.tsx`
- Hook `useI18n()` retourne `{ locale, t, setLocale }`
- Préférence sauvegardée dans `localStorage` (clé `moufacture_locale`)
- Sélecteur FR/EN dans la sidebar (boutons)
- Les traductions couvrent : nav, dashboard, factures, devis, clients, paramètres, paiements, commun

### Auth (`src/app/auth/`)

| Route | Rôle |
|---|---|
| `/auth/login` | Formulaire email + mot de passe (`signInWithPassword`) |
| `/auth/register` | Inscription + validation confirmation mot de passe (`signUp`) |
| `/auth/verify-email` | Page statique post-inscription |
| `/auth/callback` | Route Handler — échange le code PKCE contre une session, redirige vers `/dashboard` |

Layout `/auth/layout.tsx` : panneau gauche bleu (branding "La facturation pensée pour l'Afrique") + panneau droit formulaire.

### Middleware (`middleware.ts`)

Rafraîchit la session Supabase sur chaque requête et redirige vers `/auth/login` si l'utilisateur n'est pas authentifié. Routes publiques exclues : `/` (landing page), `/auth/login`, `/auth/register`, `/auth/verify-email`, `/auth/callback`.

### Emails transactionnels (Supabase + Resend SMTP)

Les emails d'authentification (confirmation d'inscription, réinitialisation de mot de passe) passent par Resend via SMTP configuré dans Supabase :
- **Host** : `smtp.resend.com` — **Port** : `465` — **Username** : `resend`
- **Sender** : `onboarding@resend.dev` (nom affiché : mouFacture)
- Configuré dans Supabase → Authentication → Email → SMTP Settings

### Pages (`src/app/`)

| Route | Comportement clé |
|---|---|
| `/` | Landing page publique — NavBar, Hero, Fonctionnalités, CTA, Footer (accessible sans auth) |
| `/dashboard` | Tableau de bord : KPI cards + graphique 6 mois glissants + accès rapide animé |
| `/invoices` | Liste avec filtres par statut (tabs) + recherche |
| `/invoices/new` | Formulaire : dropdown client, lignes dynamiques, type de taxe (TVA/TPS/Exonéré/CSS/Personnalisée), numéro éditable |
| `/invoices/[id]` | Vue propre + boutons : PDF (téléchargement), Email (si client a un email), Imprimer, Modifier, Supprimer + section paiements partiels |
| `/quotes` | Liste des devis avec filtres par statut + recherche + bouton "Convertir en facture" |
| `/quotes/new` | Formulaire devis : identique à facture mais avec date d'expiration |
| `/quotes/[id]` | Vue devis + changement de statut + édition + bouton "Convertir en facture" → redirige vers la facture créée |
| `/customers` | Grille de cards. Bouton "Nouveau client" → page dédiée. Édition via modal |
| `/customers/new` | Page formulaire complet avec aperçu d'avatar en temps réel |
| `/settings` | Paramètres entreprise + facturation (TVA, préfixe, délai paiement) |
| `/api/invoices/[id]/pdf` | Route API Node.js — génère et retourne le PDF de la facture |

### Composants layout (`src/components/layout/`)

- `DashboardLayout` — wrapper commun : gère `sidebarOpen` (mobile), passe les props à `Sidebar` et `Header`
- `Sidebar` — navigation fixe desktop / drawer mobile avec `usePathname()` pour le lien actif + sélecteur de langue FR/EN + labels traduits via `useI18n()`
- `Header` — hamburger mobile, barre de recherche desktop, bouton déconnexion (`supabase.auth.signOut()` → `/auth/login`)

### Composants UI (`src/components/ui/`)

Tous les composants UI sont implémentés **sans Radix** (sauf `Button` qui utilise `@radix-ui/react-slot`) :
- `Tabs` — implémenté avec `React.createContext`
- `Avatar` — CSS pur + fallback initiales
- `Modal` — fermeture sur Escape + backdrop + `overflow: hidden` sur body
- `Badge` — variants CVA : `default | secondary | outline | success | warning | danger`

### Animations (`src/app/globals.css`)

- `.fade-in-up` — `fadeInUp` keyframe (opacité 0→1 + translateY 18px→0, 0.45s)
- `.fade-in` — simple fondu

Utilisées sur le dashboard avec `style={{ animationDelay: '${n}ms' }}` pour l'effet décalé.

## Décisions de design

- **Pas de Radix UI pour Tabs/Avatar/Modal** — bundle plus léger, composants suffisamment simples pour être réécrits
- **`'use client'` sur toutes les pages interactives** — nécessaire pour les formulaires, filtres et états d'édition
- **Données client copiées sur la facture/devis** — `customerName`, `customerCompany`, etc. sont snapshot au moment de la création. Modifier/supprimer un client n'affecte pas les documents existants
- **PDF via `@react-pdf/renderer`** — génération serveur via route API, pas de lib browser ; `transpilePackages` requis dans `next.config.mjs`
- **Email via Resend** — PDF généré à la volée et joint à l'email ; `RESEND_API_KEY` requis en variable d'environnement
- **Formatage monétaire** — toujours via `Intl.NumberFormat('fr-FR', { currency: 'XOF' })`, jamais manuellement
- **Stats clients calculées en JS** — deux requêtes séparées (customers + invoices), agrégation côté serveur dans la Server Action
- **i18n sans routing** — contexte React + localStorage, pas de segment `[locale]` dans l'URL pour éviter un refactoring lourd
- **Paiements partiels** — recalcul du statut facture côté serveur à chaque ajout/suppression de paiement

## Instructions pour un futur modèle IA

- Toujours utiliser `formatCurrency()` et `formatDate()` de `src/lib/formatters.ts` pour afficher les montants et dates
- Pour ajouter une nouvelle entité, créer une Server Action dans `src/lib/actions/` avec vérification `auth.getUser()`, et une migration SQL dans `supabase/migrations/`
- Les montants sont toujours stockés en **entiers FCFA** — utiliser `Math.round()` avant stockage
- Le taux de TVA est stocké dans `CompanySettings.taxRate` (défaut global) ET dans chaque `Invoice.taxRate` / `Quote.taxRate` (valeur figée à la création)
- Ne pas installer Radix UI pour de nouveaux composants simples — implémenter en CSS/React pur
- Ne jamais utiliser `src/lib/store.ts` ou `src/lib/mock-data.ts` — ces fichiers ont été supprimés
- Le déploiement est sur **Vercel** (https://moufacture-tchaa-katansaous-projects.vercel.app) via push automatique sur la branche `master`
- Projet Supabase : ref `rbefcjhfzwreoqtjbols`, région `eu-west-2` (London)
- Pour les nouvelles traductions, ajouter les clés dans `src/lib/i18n/translations.ts` pour les deux locales (`fr` et `en`)
- La route PDF utilise `export const runtime = 'nodejs'` — ne pas la basculer en edge runtime
- `sendInvoiceEmail` retourne `{ success, error? }` — toujours vérifier `result.success` côté client avant d'afficher un message
