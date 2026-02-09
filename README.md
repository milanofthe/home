# milanrother.com

Personal website and portfolio for Milan Rother — research engineer and freelance consultant specializing in numerical simulation and scientific computing.

## Tech Stack

- **Framework**: SvelteKit with adapter-static
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Deployment**: GitHub Pages

## Features

- Code-rain character grid layout with monospace typography
- Embedded portal tiles with screenshot previews of project sites
- Embedded video tiles with autoplay (muted) and lazy loading
- 3D tilt effect on hover for tiles and photo
- Tile reveal animation (random cell-by-cell canvas uncover)
- Inline contact form integrated into the character grid
- Analytics dashboard with Cloudflare Web Analytics data
- GitHub stats tracking with historical data
- Screenshot capture pipeline (Puppeteer)
- Responsive design with dynamic column count

## Development

```bash
npm install
npm run dev
```

## Scripts

```bash
npm run screenshots       # Capture project site screenshots
npm run fetch-stats       # Fetch GitHub stats (PathSim, PySimHub)
npm run fetch-analytics   # Fetch Cloudflare Web Analytics data
npm run update-sitemap    # Update sitemap
```

## Deployment

The site automatically deploys to GitHub Pages when pushing to the `main` branch via GitHub Actions.

## License

All rights reserved.
