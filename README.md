# Portfolio Astro Frontend

Public Astro SSR frontend powered by the separate Payload CMS backend.

## Routes

- `/`
- `/blog`
- `/blog/[slug]`
- `/projects`
- `/projects/[slug]`
- `/graph`

## Environment variables

```env
# Server-side URL used by Astro to fetch Payload. In Docker, use http://payload:3000.
PAYLOAD_API_URL=http://localhost:3000

# Browser-visible Payload URL used for media/image URLs.
PUBLIC_PAYLOAD_URL=http://localhost:3000

# Browser-visible frontend URL used for canonical/share URLs.
PUBLIC_SITE_URL=http://localhost:4321
```

## Run

```bash
npm install
npm run dev
```

The frontend fetches public content from Payload REST endpoints such as `/api/blog-posts`, `/api/projects`, `/api/categories`, and `/api/globals/site-settings`.
