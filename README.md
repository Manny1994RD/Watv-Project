# Buscador de Sermones WATV · WATV Sermon Finder

A simple, fast website for finding the right sermon for a member. You can type a feeling or a question (for example "how to control anger", "estoy preocupado" or "Pascua"), tap a need such as *Family & children*, or narrow the list with filters. Each result shows the video thumbnail, its topics, and a link to the original video.

It covers 1,875 sermons, summary sermons and monthly sermons in Spanish and English, taken from `data/Biblioteca_Sermones_WATV.xlsx`.

## What it does

- **Smart search.** It searches each sermon's title, summary, tags and the topics spoken in it. It understands everyday words in both languages, so "sad", "triste" or "depressed" all find *Hope and comfort* sermons. Matching words are highlighted.
- **Suggestions as you type.** Typing shows matching needs, topics and tags you can tap.
- **Find by need.** There are 22 one-tap life situations, such as anger, worry, trials, family, forgiveness and new members. Results are ranked by how much each sermon is about that need.
- **Filters.** You can filter by type (sermon, summary, monthly), length, category, topic (47 topics) and the site's tags. Each option shows how many results you'd get. On phones the filters open as a bottom sheet.
- **Video panel.** It shows the thumbnail and plays the video right on the page. It also shows "Topics it covers" bars (how much each topic is discussed), tags, related sermons, a button to switch between the Spanish and English versions, share and save.
- **Saved list (♥).** Members can keep sermons to come back to. The list is stored on their own device.
- **Shareable links.** Every search, filter and video has its own link. For example `?need=worry` or `?v=123` opens that exact view.
- **Spanish / English.** The page language and the video language are set separately.
- **Phone and PC.** It has dark mode and voice search (on supported browsers), and it can be installed to the home screen and works offline. Animations are reduced for people who turn motion off.

## Run it locally

No install or build step is needed. From this folder, run:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>. You can also just double-click `index.html` (installing and offline mode only work when it is served).

## Update the sermons

1. Edit or replace `data/Biblioteca_Sermones_WATV.xlsx`, keeping the same sheets and columns.
2. Run:

   ```bash
   pip install openpyxl
   python3 tools/build_data.py
   ```

   This regenerates `data/sermons.js`. If a new topic or category appears in the Excel, the script tells you to add it to the `TOPICS` / `CATEGORIES` lists at the top of `tools/build_data.py`.
3. In `sw.js`, change `VERSION` (for example `sermones-v2`) so phones pick up the new data.
4. Publish the files again.

## Put it online for free (GitHub Pages)

1. On GitHub, open the repository, then **Settings → Pages**.
2. Under **Build and deployment**, pick **Deploy from a branch**, choose the branch and the `/ (root)` folder, then **Save**.
3. After a minute the site is live at `https://<your-user>.github.io/<repo>/`. Share that link with other churches.

Netlify or Cloudflare Pages also work: drag and drop the folder. It's a plain static site.

## Files

| File | What it is |
| --- | --- |
| `index.html` | Page structure |
| `styles.css` | Design, light/dark themes, animations, phone layout |
| `app.js` | Search, filters, needs, video panel, saved list |
| `data/sermons.js` | Sermon data generated from the Excel (don't edit by hand) |
| `tools/build_data.py` | Converts the Excel into `data/sermons.js` |
| `sw.js`, `manifest.webmanifest`, `icons/` | Home-screen install and offline support |

To change the quick "needs" or the everyday-word synonyms, edit the `NEEDS` and `SYNONYMS` lists near the top of `app.js`.
