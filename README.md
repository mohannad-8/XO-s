# XO — cheating allowed

A mobile-first GameJam prototype. The entire game is in [index.html](index.html), including its Arabic and English interface, IBM Plex Sans Arabic font, and font license. Open the file in a browser to play offline; no installation or account is required.

The older `app.js`, `game.js`, and `style.css` files remain in the repository, but the current `index.html` does not load them.

## Modes

- **Local:** two players at opposite ends of one phone. Each picks an opening cell; both moves appear together. A shared choice becomes X/O and counts for both.
- **AI:** play against the computer with cheat tools visible.
- **AI Surprise:** starts as ordinary XO. The computer cheats first; the player can discover hidden board interactions without cheat cards.

Choose Arabic or English on the mode screen or switch during a game. The language choice is saved locally. Restart and play-again controls are available in the game.

The board is a borderless 3×3 grid. Outside-corner marks appear only when used and do not change the cell size. The game includes column swaps and erasing opponent marks.

To host it on GitHub Pages, configure **Settings → Pages → Deploy from a branch → main → / (root)**. Hosting is optional; opening `index.html` directly also works.
