# Habico Property Managers

Habico is a property management platform for landlords, tenants, property teams, and construction operations in Uganda.

The application brings together:

- Property and unit management
- Tenant records, leases, and rent collection
- Maintenance requests and service coordination
- Financial reports, receipts, and payment workflows
- Construction projects, procurement, safety, and quality records
- Tenant and landlord portals
- Desktop and mobile application builds

## Technology

- React and TypeScript
- TanStack Start and TanStack Router
- Vite
- Supabase
- Capacitor for mobile builds
- Electron for the Windows desktop application

## Local development

Install dependencies with pnpm, then start the development server:

```bash
pnpm install
pnpm dev
```

Useful checks:

```bash
pnpm build
pnpm lint
```

The application requires the environment values used by the Supabase and payment integrations. Keep those values in local environment files and never commit credentials.

## Project structure

- `src/routes` contains the application routes.
- `src/components` contains shared interface components.
- `src/lib` contains server functions, reporting, licensing, and business logic.
- `src/integrations/supabase` contains the Supabase clients and generated database types.
- `supabase/migrations` contains database migrations.
- `desktop` contains the Electron application shell.
- `ios` contains the Capacitor iOS project.

## Ownership and changes

This project and its source code are owned by **TENNAHUB TECHNOLOGIES LTD**. Changes to core application code, database migrations, authentication, licensing, payments, deployment configuration, or release assets require prior written approval from TENNAHUB TECHNOLOGIES LTD.

The repository includes a CODEOWNERS policy for the owner account. Repository administrators must also enable protected branches with required CODEOWNER review before relying on that policy to block merges.

## License

This is proprietary software. Use, copying, modification, redistribution, sublicensing, and commercial exploitation are restricted by the [LICENSE](LICENSE) file. No permission is granted beyond the rights expressly provided in writing by TENNAHUB TECHNOLOGIES LTD.

## Contact

TENNAHUB TECHNOLOGIES LTD owns and maintains this project. Contact the company through its authorized project administrators for licensing, support, or access requests.
