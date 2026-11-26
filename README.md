# Museum of the Lebanese Lira · 1920–2031

A web-based augmented-reality museum built for **GEHS 260: History of the Lebanese Monetary System since 1918** (USEK, Fall 2026), **Group 5**: Bachir Rouhana, Camil Ouneissy, Georges Akiki, Salim Gergess.

Six printed exhibit frames hang around the classroom. Visitors scan the QR code on the entrance poster, open the museum in their phone browser (no app install), and point the camera at a frame. Its period then comes to life in 3D, with a museum plaque and an audio guide.

There are two ways to visit:
- **Enter the museum** (`ar.html`): point the camera at the printed exhibit frames (image tracking).
- **Museum around you** (`around.html`): no printed pictures needed. The six exhibits appear in a circle around the visitor over the live camera view, and turning the phone (motion sensors) brings each one into view. On a laptop, drag or use the arrow keys / number keys 1–6.

**Live site:** https://salimgergess08-beep.github.io/lira-museum-ar/

| # | Period | Exhibit | What comes alive |
|---|---|---|---|
| I | 1920 | The Birth of the Lira | A balance scale fills with 20 franc coins until it balances one pound |
| II | 1997–2019 | The Peg | The lira and the dollar chained together, the flat 1,507.5 line, then the crack |
| III | 2019–2023 | The Collapse | Bars rising from 1,507.5 to 15,000 to 89,500, a shrinking coin (−98%), and the 268.78% inflation peak |
| IV | 2026 | Lebanon Today | $11.4 bn in foreign reserves next to ≈$46 bn of gold, plus key indicators and the ≈$70 bn of bank losses |
| V | 2026–2031 | Our Roadmap | A coin climbs three phase steps: stop the bleeding → rebuild trust → hard anchor |
| VI | 2031 | The New Lira | The old 100,000 note shrinks (÷1,000) into a 100 New Lira specimen, gold bars rise, and five conditions turn green |

## Running the exhibition

1. Print `print/posters.pdf` on A4 at 100% scale, on matte paper if possible. Page 1 is the entrance poster with the QR code; pages 2–7 are the exhibits.
2. Tape the frames flat on the walls, in good light.
3. Visitors scan the entrance QR, tap **Enter the museum**, and allow the camera.
4. If the camera or Wi-Fi fails, use `preview.html`, which shows the same 3D exhibits without a camera, or play the backup video (`museum-backup.mp4`, kept outside the repo).

## Files

Only the source is stored in the repo. On every push to `main`, the GitHub Actions workflow (`.github/workflows/pages.yml`) runs `tools/build.mjs`, which downloads three.js and MindAR, draws the six exhibit paintings, compiles the tracking file, renders the posters, and publishes everything to GitHub Pages. In **Settings → Pages**, the source must be set to **GitHub Actions**.

```
index.html            lobby: hall list, visitor passport, instructions
ar.html               the AR scanner (MindAR image tracking + three.js)
around.html           "Museum around you": exhibits in a circle, no pictures needed
preview.html          no-camera 3D preview of every exhibit (keys 1–6)
js/exhibits.js        exhibit TEXT (plaques, audio guide) and the 3D scenes
js/museum.js          visitor passport + speech-synthesis audio guide
css/museum.css        styles
tools/targets.html    draws the exhibit paintings (the AR image targets)
tools/posters.html    printable A4 layout
tools/build.mjs       full build -> _site/ (vendor/, targets/, print/ are generated)
tools/record.mjs      renders the backup video from preview.html
```

### Editing text
Plaque and audio-guide text lives in the `EXHIBITS` array at the top of `js/exhibits.js`. Changing text does **not** require rebuilding the tracking file.

### Changing the artwork
Edit the drawings in `tools/targets.html` and push. The build redraws the paintings and recompiles the tracking file. **Print the posters again** from the live site afterwards, because old prints will no longer match.

### Building locally
```
npm install --ignore-scripts
node tools/build.mjs        # then serve _site/ over HTTPS or on localhost
```

## Sources for the figures
- Exchange-rate stabilisation at about LBP 89,500 since July 2023: The Beiruter / bne IntelliNews (June 2026)
- 1,507.5 peg, ~98% loss of value, 286.8 t of gold worth $45–47 bn, ≈$70 bn of losses: F. Belhaj, *Currency boards as political commitments*, Middle East Institute (April 2026)
- Foreign reserves ≈ $11.43 bn (end of April 2026); 17.5% inflation (September 2026); 268.78% inflation peak (April 2023): BDL / CAS data via press and Trading Economics
- −6.4% GDP projection for 2026: World Bank Lebanon Economic Monitor (August 2026)
- Policy roadmap: our group's proposal, drawing on Belhaj (2026), Geadah (2025) and Diwan & Jamali (2025), MEI

*The New Lira banknote is a fictional class-project design, marked SPECIMEN, and is not legal tender.*
