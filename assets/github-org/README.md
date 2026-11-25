# GitHub organization profile banner

`banner.svg` is the picture at the top of [github.com/Callout-Studio](https://github.com/Callout-Studio).
It is the sibling of the [README banner](../readme/00-banner.svg): the same ground, logo and title,
with the same heading, inline and block callouts shown twice, in an Obsidian note on the left and
on a web page on the right. It is brand art, not plugin UI, and is not shipped in a release.

The page itself is in another repository,
[`Callout-Studio/.github`](https://github.com/Callout-Studio/.github):

| There | What it is |
| --- | --- |
| `profile/README.md` | The page's text. It lives only there: edit it there. |
| `profile/banner.svg` | A copy of this folder's `banner.svg`. |

## Change and regenerate

`banner.svg` is generated, so don't edit it by hand. Edit `generator/build.mjs`, then run this from
the repository root:

```sh
node assets/github-org/generator/build.mjs
```

It needs nothing but Node, makes no network request, and the same source always writes the same
file. `OUT` writes the SVG somewhere else.

What you are likely to change is at the top of the script:

| Setting | What it changes |
| --- | --- |
| `TAGLINE` | The line under the title. |
| `TITLE`, `TITLE_WIDTH` | The title. The width holds it to the same size in every font, so re-measure it for a new title. |
| `COLOR` | The ground, glow, accent and text colors. |
| `WINDOW_OPACITY` | How strongly the two windows show. |
| `NOTE_PLACE`, `WEB_PLACE` | Each window's center, size and turn. |

The windows' content is in `page()`, which both windows draw, and each window's top strip is in
`noteHeader()` and `webHeader()`. The icons are Lucide (ISC), copied into the script as Obsidian
ships them; the notice is written into the SVG.

The picture is drawn about 850 px wide on a computer and about 300 px on a phone. It uses the
viewer's system font, and the tagline is not held to a width, so check a longer one in a browser:
it must stay clear of both windows.

## Publish

A separate step, never done by the generator: copy `banner.svg` over `profile/banner.svg` in
`Callout-Studio/.github`, then commit and push to `main`.

```sh
git clone https://github.com/Callout-Studio/.github.git /path/to/profile-repo
cp assets/github-org/banner.svg /path/to/profile-repo/profile/banner.svg
git -C /path/to/profile-repo commit -am "Update the banner"
git -C /path/to/profile-repo push
```

The page reads the picture from `raw.githubusercontent.com`, which keeps a copy for a few minutes,
so a change can take that long to show.
