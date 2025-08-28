# HackPSU Inventory Management System

A comprehensive inventory management application built for HackPSU, designed to track and manage physical assets, equipment, and supplies across multiple locations and categories.

## Project Overview

The HackPSU Inventory Management System is a web-based application that enables organizers to efficiently track inventory items throughout the event lifecycle. The system provides real-time visibility into item locations, status, and movement history across different event locations.

**Target Users:** HackPSU event organizers and logistics coordinators
**Primary Use Cases:**

- Track physical assets and equipment during hackathon events
- Monitor item check-in/check-out processes
- Manage inventory across multiple event locations
- Generate analytics and reports on inventory usage
- Maintain comprehensive movement history and audit trails

**Key Capabilities:**

- Real-time inventory tracking with status management
- Multi-location asset management
- Movement history and audit logging
- QR code scanning for quick item identification
- Mobile-responsive design for on-site usage
- Authentication integration with HackPSU systems

## Tech Stack

### Core Framework

- **Next.js** - App Router architecture providing server-side rendering and modern React patterns for optimal performance and SEO
- **React** - Component-based UI library with React Query for efficient data fetching and state synchronization
- **TypeScript** - Static typing for enhanced code reliability and developer experience

### Styling & UI Components

- **Tailwind CSS** - Utility-first CSS framework for rapid UI development and consistent design system
- **Radix UI** - Unstyled, accessible component primitives providing robust foundation for custom UI components
- **Framer Motion** - Animation library for smooth transitions and enhanced user interactions
- **Lucide React** - Consistent icon system with extensive icon library

### Authentication & Backend Integration

- **Firebase Authentication** - Secure user authentication with custom token integration
- **Axios** - HTTP client for API communication with the HackPSU backend services
- **Custom Authentication Provider** - Seamless integration with HackPSU's existing authentication infrastructure

### Form Handling & Validation

- **React Hook Form** - Performant form management with minimal re-renders
- **Zod** - Runtime type validation and schema parsing for form data integrity
- **Hookform Resolvers** - Bridge between React Hook Form and Zod validation schemas

### Analytics & Monitoring

- **PostHog** - User analytics and event tracking for usage insights and system monitoring
- **Vercel Analytics** - Performance monitoring and web vitals tracking

### Development Tools

- **Jest** - Testing framework with React Testing Library for component testing
- **ESLint** - Code linting with Next.js configuration for consistent code quality
- **Prettier** - Code formatting for consistent style across the codebase
- **Husky** - Git hooks for automated code quality checks

## Architecture & Design Decisions

### App Router Structure

- Utilizes Next.js 15 App Router for improved performance and developer experience
- File-based routing with nested layouts for consistent UI structure
- Server and client components strategically separated for optimal bundle size

### Authentication Strategy

- Custom Firebase authentication integration with HackPSU's central auth service
- Session-based authentication with automatic token refresh
- Context-based authentication state management across the application

### State Management

- **React Query (TanStack Query)** - Server state management with automatic caching, background updates, and optimistic updates
- **React Context** - Client-side state for authentication and global UI state
- Custom hooks pattern for encapsulating business logic and API interactions

### API Architecture

- Modular API client structure with dedicated modules for each domain (inventory, location, organizer, etc.)
- Consistent entity definitions with TypeScript interfaces
- Provider pattern for React Query integration with custom hooks

### Progressive Web App Features

- Service worker implementation for offline capabilities
- Web app manifest for native-like mobile experience
- Optimized for mobile-first usage during events

## Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- Yarn package manager
- Firebase project configuration
- Access to HackPSU backend services

### Installation

1. Clone the repository:

```bash
git clone [repository-url]
cd inventory
```

2. Install dependencies:

```bash
yarn install
```

3. Configure environment variables:

```bash
cp .env.example .env.local
```

Set the following environment variables:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_BASE_URL_V3`

4. Start the development server:

```bash
yarn dev
```

### Available Scripts

- `yarn dev` - Start development server
- `yarn build` - Build production application
- `yarn start` - Start production server
- `yarn lint` - Run ESLint for code quality checks
- `yarn format` - Format code with Prettier
- `yarn test` - Run Jest test suite

## Project Structure

```
src/
├── app/                          # Next.js App Router pages and layouts
│   ├── globals.css              # Global styles and Tailwind directives
│   ├── layout.tsx               # Root application layout
│   ├── page.tsx                 # Home page (redirects to inventory)
│   └── inventory/               # Inventory management routes
│       ├── layout.tsx           # Inventory section layout with navigation
│       ├── items/               # Item management pages
│       ├── categories/          # Category management pages
│       ├── locations/           # Location management pages
│       ├── movements/           # Movement tracking pages
│       └── analytics/           # Analytics and reporting pages
├── common/                      # Shared application logic
│   ├── api/                     # API client modules
│   │   ├── apiClient.ts         # Base HTTP client configuration
│   │   ├── inventory/           # Inventory-related API calls
│   │   ├── location/            # Location management API
│   │   └── organizer/           # Organizer management API
│   ├── config/                  # Configuration files
│   │   ├── environment.ts       # Environment variable management
│   │   └── firebase.ts          # Firebase configuration
│   ├── context/                 # React context providers
│   │   └── FirebaseProvider.tsx # Authentication state management
│   └── types/                   # TypeScript type definitions
├── components/                  # React components
│   ├── ui/                      # Reusable UI components (Radix-based)
│   ├── inventory/               # Inventory-specific components
│   │   ├── item-table.tsx       # Item listing and management
│   │   ├── category-form-dialog.tsx # Category creation/editing
│   │   └── movement-form-dialog.tsx # Movement tracking forms
│   └── InventoryBottomNavbar.tsx # Mobile navigation component
└── lib/                         # Utility functions
    └── utils.ts                 # Common utility functions and helpers
```

## Key Features

### Inventory Management

- **Item Tracking** - Complete lifecycle management of inventory items with unique identifiers
- **Status Management** - Track items through various states (active, checked out, lost, disposed, archived)
- **Asset Tagging** - Support for asset tags and serial numbers for unique item identification
- **Bulk Operations** - Efficient management of multiple items simultaneously

### Location & Movement Tracking

- **Multi-Location Support** - Manage items across different physical locations within the event
- **Movement History** - Complete audit trail of item movements with timestamps and responsible parties
- **Real-Time Updates** - Live synchronization of item locations and status changes
- **Movement Reasons** - Categorized movement tracking (checkout, return, transfer, repair, etc.)

### Category Management

- **Hierarchical Organization** - Organize items into logical categories for easy navigation
- **Category-Based Analytics** - Generate reports and insights based on item categories
- **Flexible Categorization** - Support for custom categories based on event needs

### Analytics & Reporting

- **Usage Analytics** - Track item utilization patterns and popular equipment
- **Movement Reports** - Comprehensive reporting on item movements and location changes
- **Visual Dashboards** - Chart-based analytics for quick insights and decision making

### Mobile Experience

- **QR Code Scanning** - Quick item identification and check-in/check-out processes
- **Responsive Design** - Optimized for mobile devices used during on-site operations
- **Offline Capabilities** - Progressive Web App features for reliable operation in low-connectivity environments
- **Touch-Optimized Interface** - Intuitive mobile interactions for efficient inventory management

## Deployment

The application is designed for deployment on Vercel with automatic builds from the main branch. The build process includes:

- TypeScript compilation and type checking
- Next.js optimization and bundling
- Service worker generation for PWA functionality
- Static asset optimization

Environment variables must be configured in the deployment platform to match the Firebase and backend service requirements.

## Contributing

### Code Standards

- **TypeScript** - Strict typing required for all new code
- **ESLint Configuration** - Follow Next.js recommended linting rules
- **Component Architecture** - Prefer functional components with hooks
- **API Integration** - Use React Query for all server state management
- **Accessibility** - Ensure all components meet WCAG 2.1 AA standards

### Development Workflow

- Feature development in dedicated branches
- Pull request reviews required before merge
- Automated testing and linting checks
- Consistent commit message formatting
- Code formatting with Prettier before commits
