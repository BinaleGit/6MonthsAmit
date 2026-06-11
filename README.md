# Six Months — an interactive love letter

A single-page, immersive WebGL anniversary site built with **vanilla HTML/CSS/JS**, **Three.js** and **GSAP ScrollTrigger**. No build step.

```
6month/
├─ index.html
├─ css/
│  └─ style.css
├─ js/
│  ├─ main.js                 ← entry point, render loop
│  ├─ scene.js                ← renderer + scene + lights
│  ├─ heroObject.js           ← the glowing crystal heart
│  ├─ particles.js            ← drifting firefly/dust field
│  └─ scrollAnimations.js     ← GSAP ScrollTrigger + camera flythrough
└─ assets/                    ← (optional) photos, custom GLB models
```

## Running it locally

Because the project uses ES modules and an `importmap`, you need to serve it from a local HTTP server (you can't just double-click the HTML file).

Pick whichever you have handy:

```bash
# Python 3
python -m http.server 5173

# Node (one-off, no install)
npx serve .

# VS Code → install "Live Server" extension → Right-click index.html → "Open with Live Server"
```

Then open <http://localhost:5173>.

## Personalizing it (the fun part)

Search `index.html` for **`👉 PERSONALIZE`** — every spot you should edit is marked. You'll find:

- The headline ("Six months with you.")
- Each chapter's title and body text
- The signature line
- Optional photo cards (drop images into `assets/` and update the `src`)
- The names in the top-left brand area

### Adding photos

1. Save your photos into `assets/` (e.g. `assets/photo-01.jpg`).
2. Update the `<img src="...">` in the relevant memory section.
3. If you don't want a photo, simply delete the `<figure class="memory__photo">` block — the layout handles it.

### Adding your song

Drop the MP3 at `assets/our-song.mp3` and the floating **Play our song** button in the bottom-right will use it. To use a different filename or format, edit the `<source>` tag inside `<audio id="bg-music">` in `index.html`. The player fades in/out softly and shows a pulsing pink/gold indicator while playing.

> Note: browsers block audio from auto-starting before a user gesture — the button click *is* that gesture, so playback always works on the first click.

### Adding more memory sections

Copy any `<section class="panel panel--memory" data-panel="memory-X">` block and paste it before the outro. Then add one more waypoint to the `WAYPOINTS` array in `js/scrollAnimations.js` so the camera has a new spot to fly to.

### Tweaking colors / mood

All romantic colors live in CSS custom properties at the top of `css/style.css`:

```css
--rose:    #ffb3d1;
--magenta: #ff79c6;
--plum:    #6b3fa0;
--gold:    #f6c478;
```

The matching 3D lights are in `js/scene.js` (look for `keyLight`, `fillLight`, `rimLight`). Change the hex colors there to keep the WebGL scene in sync with the CSS palette.

## Swapping the crystal for your own 3D model

The hero object lives in `js/heroObject.js`. There's a comment block at the top with a step-by-step. Short version:

```js
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
loader.load('./assets/heart.glb', (gltf) => {
  const model = gltf.scene;
  model.scale.setScalar(1.2);
  group.add(model);
});
```

Then delete (or comment out) the `crystal`, `halo` and `core` meshes if you want the model to stand alone. The mouse parallax, scroll camera and lighting will all still work because they target the wrapping `group`.

Good places to grab free models:
- [Sketchfab](https://sketchfab.com/) (filter by "Downloadable, GLTF")
- [Poly Pizza](https://poly.pizza/)
- [Three.js editor](https://threejs.org/editor/) — drag/drop and export as GLB.

## Tweaking the camera flythrough

Open `js/scrollAnimations.js` and edit the `WAYPOINTS` array. Each entry is a camera position + a `lookAt` target. The flythrough is fully scrubbed to scroll, so design it like a storyboard.

## Browser support

Built for modern evergreen browsers (Chrome, Edge, Firefox, Safari 16+). Reduced-motion users get a static experience automatically.

---

Happy six months 💌
