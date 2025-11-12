# Imposter - Local Pass-and-Play Game

A simple browser game: each round one random player is the Imposter. Everyone else sees the Topic; the Imposter only gets a Hint. Discuss and vote!

## Run

You can open `index.html` directly, or host the folder on a static site.

Notes:
- When opened directly (file://), browsers may block automatic `fetch`. Host the folder for best results.
- When hosted on a domain, the app will auto-load `topics.json` if present.

## How to Play

1. Add 3+ players by name.
2. Load topics:
   - Host the site with a `topics.json` file in the project root.
3. Choose number of rounds and Start Game.
4. Pass the device; each player taps Reveal to see their secret:
   - Imposter: sees a Hint only.
   - Others: see the Topic.
5. After all players revealed, discuss and vote.
6. Continue to next round or end game.

## Topics JSON Format

Provide an array of objects. Supported shapes:

```json
[
  { "topic": "Pizza", "hints": ["It's round", "Has cheese"] },
  { "topic": "Library", "hint": "Quiet place" }
]
```

Also accepted synonyms: `name` for `topic`, `clues` for `hints`.
Hints can be a single `hint` string or an array `hints` of strings.

Invalid entries (missing topic or hints) are ignored.

Place your file at `topics.json` in the project root to enable automatic loading when hosted.

## Notes

- All logic is client-side. No data leaves your device.
- Works offline; custom topics are loaded via FileReader when opened locally.

## Hosting on a domain

Any static hosting works. Examples:

- GitHub Pages:
  - Create a repo and push this folder.
  - Enable Pages for the `main` branch (root).
  - Visit your `https://<user>.github.io/<repo>/`.
- Netlify:
  - Drag-and-drop the folder on the Netlify dashboard or connect your repo.
  - Set deploy directory to the project root.
- Vercel:
  - Import the repo; framework preset: "Other".
  - Build command: none, Output directory: `.`.
- Custom domain:
  - Point DNS (CNAME/A) to your host (Netlify/Vercel/GitHub Pages) and attach the domain in their dashboard.

Make sure `topics.json` is included in the deployed files so the app can load topics automatically.


