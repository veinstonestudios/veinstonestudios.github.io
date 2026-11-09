# The Facility Wiki — editing guide

The wiki lives in this `wiki/` folder and is published at
**https://veinstonestudios.github.io/wiki/**. It is plain static files: no build
step, no backend. Commit and push, and GitHub Pages serves it.

```
wiki/
├── index.html              App shell (header, sidebar, footer). Rarely edited.
├── content/
│   ├── config.js           Article list, sidebar, Main Page settings
│   └── articles/*.md       One Markdown file per article  ← you edit these
└── assets/
    ├── css/wiki.css        Styles
    ├── js/wiki.js          Engine (rendering, search, categories)
    ├── fonts/              Wordmark font
    └── img/                Optimised images (characters/, screens/)
```

## Add a new article

1. Copy an existing article of the same kind (for example `articles/bob.md` for an
   inmate) to a new file, such as `articles/new-character.md`.
2. Edit the front matter (between the `---` lines) and the text.
3. Add the file name, without `.md`, to the `articles` list in `content/config.js`.
4. Optional: add it to the `sidebar` or the `mainPage` lists in the same file.
5. Bump `version` in `content/config.js` so visitors' browsers fetch the new files.

The article's address is created from its title: `?page=New_Character`.
Pretty addresses such as `/wiki/New_Character` also work (handled by `/404.html`).

## Front matter reference

```yaml
---
title: Ted Karinsky                 # page title (must be unique)
type: character                     # character | location | lore | game | world | timeline | category | project
role: Inmate                        # short label on cards (optional)
categories: Inmates                 # comma separated; first one drives the breadcrumb
aliases: Ted, Karinsky              # other names that lead to this page and help search
summary: One-sentence description.  # used on the Main Page, search and cards
image: assets/img/characters/ted-karinsky.jpg   # leave empty for a placeholder
caption: Character artwork
spoilers: true                      # shows the spoiler banner
spoiler-note: Optional extra text for the banner.
stub: true                          # shows the "stub" banner
created: 2026-11-09                 # used for "Latest additions"
updated: 2026-11-09                 # used for "Recent changes" and the page footer
infobox:
  [Section heading]
  Label: Value
  Several values: First; Second     # semicolons become line breaks
  Age: Unknown                      # "Unknown" renders as an Unknown tag
  Height: TBA                       # "TBA" renders as "Not yet documented"
---
```

## Writing syntax

| You write | You get |
|---|---|
| `## Heading` / `### Subheading` | Sections (listed in the table of contents once there are 3+) |
| `[[Facility 61]]` | Link to an article |
| `[[Facility 61\|the facility]]` | Link with different text |
| `[[Henry Edaven#Family]]` | Link to a section |
| `[[Category:Inmates]]` | Link to a category |
| `[text](https://…)` | External link |
| `**bold**`, `*italic*` | Bold, italic |
| `{{unknown}}` `{{unconfirmed}}` `{{confirmed}}` `{{tba}}` | Status labels |
| `{{missing}}` on its own line | "Not documented yet" placeholder box |
| `\|\|hidden text\|\|` | Inline spoiler, revealed on click |
| `[REDACTED]` | Black redaction bar |
| `- item` / `1. item` | Lists |
| `\| a \| b \|` rows | Tables (first row is the header) |

Boxes use `:::type Optional title` … `:::`. Types: `unknown`, `confirmed`, `note`,
`spoiler`, `warning`, `source`, `dev`, `quote`, `gallery`.

```
:::quote
I've seen *them*.
— Ted, as shown in a development screenshot
:::

:::gallery
assets/img/screens/hall.jpg | A hall inside the facility
placeholder | Image coming soon
:::
```

## Categories

Every value in `categories:` becomes a category page automatically. To give a
category an introduction or a parent, create `articles/category-name.md` with
`title: Category:Name`, `type: category` and, optionally, `parent: Characters`,
and add it to `config.js`. `Stubs` and `Articles with spoilers` are filled in
automatically from the `stub` and `spoilers` flags.

## Images

Put web-sized images in `assets/img/` (JPG, about 1280 px wide for screenshots,
about 520 px wide for portraits). The original multi-megabyte PNGs elsewhere in the
repository are not used by the wiki. With ffmpeg:

```
ffmpeg -i input.png -vf "scale='min(1280,iw)':-2" -q:v 5 wiki/assets/img/screens/name.jpg
```

## Content rules

- Only confirmed information is written as fact. Mark everything else as unknown.
- Never turn theories into facts, and do not resolve the story's intentional mysteries.
- Do not invent characters, locations, ages, relationships or backstories.
- *The Facility* is the game; **Facility 61** is a location inside it.

## Testing locally

Browsers will not load the article files from `file://`. Run any static server
from the repository root and open `http://localhost:PORT/wiki/`, for example:

```
python -m http.server 8000
```
