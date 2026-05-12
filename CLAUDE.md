# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Ce que fait l'application

**tchaaFacture** est un SaaS de facturation en ligne destiné aux PME d'Afrique de l'Ouest. Il permet de créer et gérer des factures, des clients, et de suivre les revenus via un tableau de bord. L'application fonctionne entièrement côté client (pas de backend) — les données sont persistées dans le `localStorage` du navigateur. La devise principale est le Franc CFA (XOF).

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
- **localStorage** — seule persistance de données (pas de base de données)

### Structure des données (`src/lib/`)

| Fichier | Rôle |
|---|---|
| `types.ts` | Interfaces TypeScript partagées (`Invoice`, `Customer`, `CompanySettings`, etc.) |
| `store.ts` | Hooks React (`useInvoices`, `useCustomers`, `useSettings`) qui lisent/écrivent dans le localStorage |
| `mock-data.ts` | 12 clients fictifs + 20 factures fictives chargées au premier démarrage |
| `formatters.ts` | `formatCurrency(n)` → XOF via `Intl`, `formatDate(s)` → `Intl.DateTimeFormat` fr-FR |
| `utils.ts` | Utilitaire `cn()` pour fusionner les classes Tailwind |

### Flux de données

Chaque hook dans `store.ts` suit ce pattern :
1. Initialise l'état React avec les données fictives (`mockInvoices` / `mockCustomers`)
2. Dans `useEffect`, recharge depuis le localStorage (clés versionnées : `tf_invoices_v3`, `tf_customers_v3`, `tf_settings_v3`)
3. Toute mutation appelle `persist()` qui met à jour l'état ET écrit dans le localStorage

**Important** : changer les clés localStorage (ex : `v3` → `v4`) réinitialise toutes les données utilisateur et recharge les données fictives — c'est le mécanisme de reset intentionnel.

### Numérotation des factures

```ts
nextInvoiceNumber() = settings.invoicePrefix + padStart(settings.startingNumber + invoices.length, 3)
```
Avec `startingNumber = 1` et 20 factures fictives → prochaine = `INV-021`.

### Pages (`src/app/`)

| Route | Comportement clé |
|---|---|
| `/` | Dashboard : KPI cards + graphique 6 mois glissants + accès rapide animé |
| `/invoices` | Liste avec filtres par statut (tabs) + recherche |
| `/invoices/new` | Formulaire : dropdown client, lignes dynamiques, TVA éditable, bouton "Enregistrer" → sauvegarde + redirige vers `/invoices/[id]?print=true` |
| `/invoices/[id]` | Vue propre + boutons changement de statut + mode édition inline. Si `?print=true` en URL, déclenche `window.print()` après 600 ms |
| `/customers` | Grille de cards. Bouton "Nouveau client" → page dédiée. Édition via modal |
| `/customers/new` | Page formulaire complet avec aperçu d'avatar en temps réel |
| `/settings` | Paramètres entreprise + facturation (TVA, préfixe, délai paiement) |

### Composants layout (`src/components/layout/`)

- `DashboardLayout` — wrapper commun : gère l'état `sidebarOpen` (mobile), passe les props à `Sidebar` et `Header`
- `Sidebar` — navigation fixe desktop / drawer mobile (`fixed + translate-x`) avec `usePathname()` pour le lien actif
- `Header` — hamburger mobile, barre de recherche desktop

### Composants UI (`src/components/ui/`)

Tous les composants UI sont implémentés **sans Radix** (sauf `Button` qui utilise `@radix-ui/react-slot`) :
- `Tabs` — implémenté avec `React.createContext`
- `Avatar` — CSS pur + fallback initiales
- `Modal` — fermeture sur Escape + backdrop + `overflow: hidden` sur body
- `Badge` — variants CVA : `default | secondary | outline | success | warning | danger`

### Animations (`src/app/globals.css`)

Deux classes CSS disponibles :
- `.fade-in-up` — `fadeInUp` keyframe (opacité 0→1 + translateY 18px→0, 0.45s)
- `.fade-in` — simple fondu

Utilisées sur le dashboard avec `style={{ animationDelay: '${n}ms' }}` pour l'effet décalé.

## Décisions de design

- **Pas de Radix UI pour Tabs/Avatar/Modal** — bundle plus léger, composants suffisamment simples pour être réécrits
- **`'use client'` sur toutes les pages** — nécessaire car toutes lisent le localStorage via les hooks du store
- **Données client copiées sur la facture** — `customerName`, `customerCompany`, `customerEmail`, etc. sont copiés depuis le client au moment de la création de la facture. Ainsi, modifier ou supprimer un client n'affecte pas les factures existantes
- **PDF via `window.print()`** — pas de lib externe ; le navigateur gère "Enregistrer en PDF"
- **Formatage monétaire** — toujours via `Intl.NumberFormat('fr-FR', { currency: 'XOF' })`, jamais manuellement

## Instructions pour un futur modèle IA

- Toujours utiliser `formatCurrency()` et `formatDate()` de `src/lib/formatters.ts` pour afficher les montants et dates
- Pour ajouter une nouvelle entité persistée, suivre le pattern `useState` + `useEffect` + `localStorage` de `store.ts`
- Pour réinitialiser le localStorage (nouveau schéma de données), incrémenter le suffixe des clés dans `KEYS` (ex : `v3` → `v4`)
- Les montants sont toujours stockés en **entiers FCFA** — utiliser `Math.round()` avant stockage
- Le taux de TVA est stocké à la fois dans `CompanySettings.taxRate` (défaut global) et dans chaque `Invoice.taxRate` (valeur au moment de la création)
- Ne pas installer Radix UI pour de nouveaux composants simples — implémenter en CSS/React pur comme le reste
- Le déploiement est sur **Vercel** (https://tchaafacture.vercel.app) via push automatique sur la branche `master`
