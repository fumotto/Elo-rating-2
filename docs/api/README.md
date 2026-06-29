# API Documentation

This directory contains a Swagger/OpenAPI catalogue for the requests issued by the frontend against the Supabase-backed backend.

- OpenAPI file: [openapi.yaml](openapi.yaml)
- Source of truth for the request list: [vite/src/lib/api.ts](../../vite/src/lib/api.ts)

## Regeneration

Run the generator from the repository root:

```bash
node scripts/generate-api-docs.mjs
```
