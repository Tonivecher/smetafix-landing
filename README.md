# SmetaFix Landing

Next.js landing page MVP for SmetaFix, a Russian micro-SaaS concept for checking, converting and preparing construction estimates.

## Routes

- `/` contains the main SmetaFix landing with upload, calculator and check report
- `/awwwards` contains the creative editorial variant
- `/minimal` contains the calm workspace variant

## Development

```bash
npm install
npm run dev
```

## Verification

```bash
npm run lint
npm run build
```

The current MVP reads XLSX, CSV, TSV and TXT files in the browser, checks estimate arithmetic and generates a technical report with findings, recommendations and browser print/PDF support.
