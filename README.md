# ZST Marketplace

A multi-tier B2B/B2C e-commerce platform connecting importers, wholesalers, retailers, and customers. Built with Next.js 15, Supabase, and Tailwind CSS.

## Platform Overview

ZST Marketplace is a two-sided marketplace with three distinct interfaces:

- **B2C Shopping** (Public): E-commerce site for customers to browse and purchase products via Cash on Delivery
- **B2B Business Portal** (Authenticated): Members-only portal for Importers, Wholesalers, and Retailers with hierarchical product visibility
- **Admin Panel** (Role-based): Platform management interface for administrators

## Key Features

- 🏪 **Multi-Tier B2B Model** - Hierarchical marketplace (Importers → Wholesalers → Retailers → Customers)
- 🛒 **B2C Shopping** - Public storefront with cash-on-delivery checkout
- 💼 **Business Dashboard** - Role-based product catalog, order management, and analytics
- 📦 **Inventory Management** - Product listings with stock tracking and image uploads
- 🔐 **Secure Authentication** - Supabase Auth with role-based access control (RLS)
- 📊 **Admin Panel** - User, product, category, and order management
- 🌐 **Multi-Language Support** - English and Arabic (العربية) with RTL support

## Language Support

ZST Marketplace is available in multiple languages:
- **English**: Main interface at `/`, `/login`, `/signup`, `/business/*`, `/admin/*`
- **Arabic (العربية)**: Arabic pages at `/ar/*` with full RTL support and Arabic typography
- Currently supports manual language switching via separate routes

## Technology Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Authentication**: Supabase Auth with Row Level Security (RLS)
- **File Storage**: Supabase Storage (product images)
- **Deployment**: Vercel (recommended)

## Architecture

This is a monorepo using npm workspaces:
- `apps/client/` - Next.js 15 frontend application
- `apps/server/` - Express backend (minimal usage, contains legacy code)
- `packages/types/` - Shared TypeScript types

The frontend communicates **directly with Supabase** for all data operations. Security is enforced through Row Level Security (RLS) policies in the database.

## User Roles

- **Importer**: Creates listings targeting wholesalers
- **Wholesaler**: Buys from importers, sells to retailers
- **Retailer**: Buys from wholesalers, sells to customers (B2C)
- **Admin**: Full platform management access

## Key Documentation

- **Quick Start**: `QUICKSTART.md` - Get up and running in 5 minutes
- **Project Summary**: `PROJECT_SUMMARY.md` - Complete technical overview
- **CLAUDE.md**: `CLAUDE.md` - AI assistant guidance for this codebase
- **Coding Standards**: `docs/coding-standards.md` - TypeScript, naming conventions
- **Definition of Done**: `docs/dod.md` - Quality checklist
- **Repo Setup**: `docs/repo-setup.md` - Git workflows and setup
