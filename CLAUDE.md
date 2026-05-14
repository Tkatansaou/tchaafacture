# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Ce que fait l'application

**mouFacture** est un SaaS de facturation en ligne destiné aux PME d'Afrique de l'Ouest. Il permet de créer et gérer des factures, des clients, et de suivre les revenus via un tableau de bord. C'est une application **full-stack multi-tenant** : chaque utilisateur a ses propres données, isolées par Row Level Security dans Supabase. La devise principale est le Franc CFA (XOF).

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

### Variables d'environnement (`.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=https://rbefcjhfzwreoqtjbols.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<clé anon>
```

Ces variables sont également configurées sur Vercel (production + preview + development).

### Structure des données (`src/lib/`)

| Fichier | Rôle |
|---|---|
| `types.ts` | Interfaces TypeScript partagées (`Invoice`, `Customer`, `CompanySettings`, etc.) |
| `formatters.ts` | `formatCurrency(n)` → XOF via `Intl`, `formatDate(s)` → `Intl.DateTimeFormat` fr-FR |
| `utils.ts` | Utilitaire `cn()` pour fusionner les classes Tailwind |
| `supabase/client.ts` | Client navigateur (`createBrowserClient`) |
| `supabase/server.ts` | Client serveur (`createServerClient` avec cookies Next.js) |
| `supabase/middleware.ts` | `updateSession()` — rafraîchit le token à chaque requête |

> `store.ts` et `mock-data.ts` ont été supprimés — remplacés par les Server Actions.

### Server Actions (`src/lib/actions/`)

Toute interaction avec la base de données passe par ces Server Actions (`'use server'`). Elles vérifient systématiquement `supabase.auth.getUser()` avant toute requête.

| Fichier | Fonctions |
|---|---|
| `invoices.ts` | `getInvoices`, `getInvoice`, `createInvoice`, `updateInvoice`, `updateInvoiceStatus`, `deleteInvoice`, `nextInvoiceNumber` |
| `customers.ts` | `getCustomers` (avec stats agrégées), `createCustomer`, `updateCustomer`, `deleteCustomer` |
| `settings.ts` | `getSettings` (upsert au premier appel), `updateSettings` |

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

4 tables dans Supabase, toutes protégées par RLS (`auth.uid() = user_id`) :

- **`company_settings`** — 1 ligne par utilisateur (upsert sur `user_id`)
- **`customers`** — clients de l'utilisateur
- **`invoices`** — factures (id = chaîne type `INV-021`)
- **`invoice_items`** — lignes de facture (FK → `invoices.id` ON DELETE CASCADE)

Migration complète : `supabase/migrations/001_initial_schema.sql`

### Numérotation des factures

`nextInvoiceNumber()` interroge la table `invoices` pour trouver le dernier numéro séquentiel et incrémente. Résistant aux suppressions (ne réutilise pas un numéro supprimé).

### Auth (`src/app/auth/`)

| Route | Rôle |
|---|---|
| `/auth/login` | Formulaire email + mot de passe (`signInWithPassword`) |
| `/auth/register` | Inscription + validation confirmation mot de passe (`signUp`) |
| `/auth/verify-email` | Page statique post-inscription |
| `/auth/callback` | Route Handler — échange le code PKCE contre une session, redirige vers `/` |

Layout `/auth/layout.tsx` : centré, sans sidebar.

### Middleware (`middleware.ts`)

Rafraîchit la session Supabase sur chaque requête et redirige vers `/auth/login` si l'utilisateur n'est pas authentifié. Routes publiques exclues : `/auth/login`, `/auth/register`, `/auth/verify-email`, `/auth/callback`.

### Pages (`src/app/`)

| Route | Comportement clé |
|---|---|
| `/` | Dashboard : KPI cards + graphique 6 mois glissants + accès rapide animé |
| `/invoices` | Liste avec filtres par statut (tabs) + recherche |
| `/invoices/new` | Formulaire : dropdown client, lignes dynamiques, TVA éditable, bouton "Enregistrer" → sauvegarde + redirige vers `/invoices/[id]?print=true` |
| `/invoices/[id]` | Vue propre + boutons changement de statut + mode édition inline. Si `?print=true` en URL, déclenche `window.print()` après 600 ms, puis `router.replace` pour nettoyer l'URL |
| `/customers` | Grille de cards. Bouton "Nouveau client" → page dédiée. Édition via modal |
| `/customers/new` | Page formulaire complet avec aperçu d'avatar en temps réel |
| `/settings` | Paramètres entreprise + facturation (TVA, préfixe, délai paiement) |

### Composants layout (`src/components/layout/`)

- `DashboardLayout` — wrapper commun : gère `sidebarOpen` (mobile), passe les props à `Sidebar` et `Header`
- `Sidebar` — navigation fixe desktop / drawer mobile avec `usePathname()` pour le lien actif
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
- **Données client copiées sur la facture** — `customerName`, `customerCompany`, `customerEmail`, etc. sont snapshot au moment de la création. Modifier/supprimer un client n'affecte pas les factures existantes
- **PDF via `window.print()`** — pas de lib externe ; le navigateur gère "Enregistrer en PDF"
- **Formatage monétaire** — toujours via `Intl.NumberFormat('fr-FR', { currency: 'XOF' })`, jamais manuellement
- **Stats clients calculées en JS** — deux requêtes séparées (customers + invoices), agrégation côté serveur dans la Server Action (pas de `GROUP BY` Supabase JS non standard)

## Instructions pour un futur modèle IA

- Toujours utiliser `formatCurrency()` et `formatDate()` de `src/lib/formatters.ts` pour afficher les montants et dates
- Pour ajouter une nouvelle entité, créer une Server Action dans `src/lib/actions/` avec vérification `auth.getUser()`, et une migration SQL dans `supabase/migrations/`
- Les montants sont toujours stockés en **entiers FCFA** — utiliser `Math.round()` avant stockage
- Le taux de TVA est stocké dans `CompanySettings.taxRate` (défaut global) ET dans chaque `Invoice.taxRate` (valeur figée à la création)
- Ne pas installer Radix UI pour de nouveaux composants simples — implémenter en CSS/React pur
- Ne jamais utiliser `src/lib/store.ts` ou `src/lib/mock-data.ts` — ces fichiers ont été supprimés
- Le déploiement est sur **Vercel** (https://tchaafacture.vercel.app) via push automatique sur la branche `master`
- Projet Supabase : ref `rbefcjhfzwreoqtjbols`, région `eu-west-2` (London)
