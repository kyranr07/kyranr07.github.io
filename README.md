# Kyran Romero: research website

A plain HTML and CSS site with no build step. GitHub Pages serves it as is.

## Folder layout

```
index.html                 the whole page (About, Papers, Posters, Talks)
cows.js                    the wandering cows in the side margins
tour.html, tour.js         the pixel tour of Jemez Pueblo
assets/tour/               tour scenes and character sprites
styles.css                 colors, fonts, layout
assets/Kyran_Romero_CV.pdf your CV (replace it when you update)
assets/posters/            poster PDFs and PNG previews
assets/papers/             paper PDFs
.nojekyll                  tells GitHub Pages to serve files as is
```

## Put it online

1. Create a public repo named `YOUR-USERNAME.github.io`.
2. Upload everything in this folder to the root of that repo.
3. In the repo, open Settings, then Pages. Set the source to "Deploy from a branch", branch `main`, folder `/ (root)`.
4. After a minute or two the site is live at `https://YOUR-USERNAME.github.io`.

Using a different repo name also works; the site will be at `https://YOUR-USERNAME.github.io/REPO-NAME`.

## Before you publish

- In `index.html`, replace `YOUR-USERNAME` in the GitHub link.
- Add a Google Scholar link if you have one (commented out in the sidebar).
- Optional headshot: save it as `assets/headshot.jpg` and uncomment the `<img>` line at the top of the sidebar.

## Add your posters

Each poster needs two files in `assets/posters/` with the same base name:

- `2026-cmu-verification-override.pdf` and `2026-cmu-verification-override.png`
- `2026-kempner-cognitive-differences.pdf` and `2026-kempner-cognitive-differences.png`

The PNG is the small preview. Export page 1 of the poster at about 600 px wide. If a PNG is missing, the entry still shows without a preview.

For a new poster, copy one `<article class="poster">` block in `index.html` and change the file names and text.

## Add a paper

In the Papers section of `index.html`:

1. Delete the line that says "Papers will be listed here as they are published."
2. Copy the commented template block below it, remove the `<!--` and `-->` around your copy, and fill it in.
3. Put the PDF in `assets/papers/`. Keep the newest paper at the top.

## The cows

`cows.js` draws the grazing cows in the side margins. They only appear when the window is wide
enough to fit them without touching the text. Settings like the number of cows, walking speed
and grazing time are at the top of the file.

## The tour

`tour.html` is the pixel walk through Jemez, linked from the "Take a tour of my home" button.
To change what each stop says, edit the `text` lines in the SCENES list at the top of `tour.js`.

## Update the date

Change "Last updated" in the footer when you edit the site.
