/**
 * Builds the banner at the top of the GitHub organization's profile page
 * (github.com/Callout-Studio). It is the README banner's sibling: the same ground, logo and
 * title, with the same three callouts shown twice, in an Obsidian note on the left and on a
 * web page on the right.
 *
 * Run `node assets/github-org/generator/build.mjs`. It needs nothing but Node.
 * `OUT` writes the SVG somewhere else. Publishing it is a separate step: see ../README.md.
 */
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/* ---------- What you are likely to change ---------- */

const TITLE = "Callout Studio";
/** The title is held to this width, so a different font cannot widen it. Re-measure if TITLE changes. */
const TITLE_WIDTH = 258.422;
const TAGLINE = "Your callouts, in Obsidian and on the web.";

const SIZE = { width: 670, height: 214, radius: 8 };
const OUTPUT_WIDTH = 1600;

const COLOR = {
	groundFrom: "#14101e",
	groundTo: "#1c142b",
	glow: "#39265f",
	accent: "#b392ff",
	blockTint: "#8963c9",
	title: "#f5f2ff",
	tagline: "#ccb9e7",
};

/** How strongly the two windows show against the ground. The README banner's edges use 0.25. */
const WINDOW_OPACITY = 0.32;
const WINDOW = { width: 164, height: 200 };
/**
 * Each window's center, size and turn, in banner units. Both run off the bottom edge on
 * purpose; their sides stay inside the banner, so no corner is clipped by chance.
 */
const NOTE_PLACE = { x: 95, y: 137, scale: 0.94, rotate: -7 };
const WEB_PLACE = { x: SIZE.width - 95, y: 137, scale: 0.94, rotate: 7 };

/* ---------- Icons ---------- */

/** Lucide geometry as Obsidian ships it, on a 24px canvas. */
const ICON = {
	paintbrush:
		'<path d="m14.622 17.897-10.68-2.913"/><path d="M18.376 2.622a1 1 0 1 1 3.002 3.002L17.36 9.643a.5.5 0 0 0 0 .707l.944.944a2.41 2.41 0 0 1 0 3.408l-.944.944a.5.5 0 0 1-.707 0L8.354 7.348a.5.5 0 0 1 0-.707l.944-.944a2.41 2.41 0 0 1 3.408 0l.944.944a.5.5 0 0 0 .707 0z"/><path d="M9 8c-1.804 2.71-3.97 3.46-6.583 3.948a.507.507 0 0 0-.302.819l7.32 8.883a1 1 0 0 0 1.185.204C12.735 20.405 16 16.792 16 15"/>',
	"file-text":
		'<path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
	globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
	lightbulb:
		'<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',
	"chevron-down": '<path d="m6 9 6 6 6-6"/>',
	check: '<path d="M20 6 9 17l-5-5"/>',
	"book-open":
		'<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
};

const LUCIDE_NOTICE = `<!-- Lucide icons: Copyright (c) 2026 Lucide Icons and Contributors. ISC License.
Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.
THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE. -->`;

/* ---------- Shapes ---------- */

const escapeText = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const round = (value) => Number(value.toFixed(4));

function icon(name, x, y, size, strokeWidth = 1.8) {
	if (!ICON[name]) throw new Error(`Unknown icon: ${name}`);
	return `<g data-icon="lucide-${name}" transform="translate(${x} ${y}) scale(${round(size / 24)})" fill="none" stroke="${COLOR.accent}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${ICON[name]}</g>`;
}

/** A stand-in for a run of text. */
function bar(x, y, width, height = 4, opacity = 1) {
	const faded = opacity === 1 ? "" : ` opacity="${opacity}"`;
	return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${height / 2}" fill="${COLOR.accent}"${faded}/>`;
}

function outline(x, y, width, height, radius, fill, fillOpacity) {
	const faded = fillOpacity === undefined ? "" : ` fill-opacity="${fillOpacity}"`;
	return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="${fill}"${faded} stroke="${COLOR.accent}" stroke-width="1"/>`;
}

/** The three ways to write a callout, with plain text around them. Both windows show it. */
function page() {
	return [
		// Heading callout
		outline(12.5, 38.5, 139, 25, 4, COLOR.accent, 0.12),
		icon("lightbulb", 20, 44, 14),
		bar(41, 48.5, 62, 5),
		icon("chevron-down", 132, 45, 12),
		bar(12, 74, 134, 4, 0.6),
		// Inline callout, inside a line of text
		bar(12, 91, 36, 4, 0.6),
		outline(54.5, 84.5, 51, 17, 5, COLOR.accent, 0.12),
		icon("check", 61, 88, 10),
		bar(77, 91.5, 21, 3),
		bar(112, 91, 38, 4, 0.6),
		bar(12, 108, 96, 4, 0.6),
		// Block callout
		outline(12.5, 122.5, 139, 70, 7, "url(#block-fill)"),
		icon("book-open", 21, 131, 14),
		bar(42, 135.5, 54, 5),
		bar(21, 156, 118, 4, 0.6),
		bar(21, 167, 90, 4, 0.6),
		bar(21, 178, 108, 4, 0.6),
	].join("\n    ");
}

const noteHeader = () => [icon("file-text", 13, 8, 12), bar(31, 12, 52, 4)].join("\n    ");

const webHeader = () =>
	[
		...[15, 24, 33].map((x) => `<circle cx="${x}" cy="14" r="2.5" fill="${COLOR.accent}"/>`),
		outline(44.5, 7.5, 107, 13, 6.5, COLOR.accent, 0.08),
		icon("globe", 50, 9.5, 9, 2),
		bar(64, 12.5, 56, 3),
	].join("\n    ");

function paneWindow(name, place, header) {
	const { width, height } = WINDOW;
	return `  <g data-banner-item="${name}" transform="translate(${place.x} ${place.y}) rotate(${place.rotate}) scale(${place.scale}) translate(${-width / 2} ${-height / 2})">
    ${outline(0.5, 0.5, width - 1, height - 1, 10, "url(#block-fill)")}
    <path d="M1 28.5H${width - 1}" stroke="${COLOR.accent}" stroke-width="1"/>
    ${header()}
    ${page()}
  </g>`;
}

const FONT = "-apple-system, &quot;system-ui&quot;, &quot;Segoe UI&quot;, Arial, sans-serif";

function banner() {
	const { width, height, radius } = SIZE;
	const outputHeight = Math.round((OUTPUT_WIDTH * height) / width);
	const middle = width / 2;
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${OUTPUT_WIDTH}" height="${outputHeight}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title description">
<title id="title">${escapeText(TITLE)}</title>
<desc id="description">${escapeText(TAGLINE)} A paintbrush logo on a purple background, between an Obsidian note and a web page that show the same heading, inline, and block callouts.</desc>
<!-- Generated by assets/github-org/generator/build.mjs in Callout-Studio/obsidian. Change it there, not here. -->
${LUCIDE_NOTICE}
<defs>
<clipPath id="banner-clip"><rect width="${width}" height="${height}" rx="${radius}"/></clipPath>
<linearGradient id="background" gradientUnits="userSpaceOnUse" x1="15" y1="-32" x2="655" y2="246"><stop stop-color="${COLOR.groundFrom}"/><stop offset="1" stop-color="${COLOR.groundTo}"/></linearGradient>
<radialGradient id="glow" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="1" gradientTransform="translate(${middle} 64.2) scale(473.7615 211.8482)"><stop stop-color="${COLOR.glow}"/><stop offset="0.68" stop-color="${COLOR.glow}" stop-opacity="0"/></radialGradient>
<linearGradient id="block-fill" x1="7%" y1="25%" x2="93%" y2="75%"><stop stop-color="${COLOR.blockTint}" stop-opacity="0.2"/><stop offset="1" stop-color="${COLOR.blockTint}" stop-opacity="0.05"/></linearGradient>
<linearGradient id="logo-fill" x1="21%" y1="9%" x2="79%" y2="91%"><stop stop-color="${COLOR.accent}" stop-opacity="0.082"/><stop offset="1" stop-color="${COLOR.accent}" stop-opacity="0.02"/></linearGradient>
</defs>
<g clip-path="url(#banner-clip)">
<rect width="${width}" height="${height}" fill="url(#background)"/>
<rect width="${width}" height="${height}" fill="url(#glow)"/>
<g opacity="${WINDOW_OPACITY}">
${paneWindow("obsidian-note", NOTE_PLACE, noteHeader)}
${paneWindow("web-page", WEB_PLACE, webHeader)}
</g>
<g transform="translate(5.025 -7.3) scale(0.985)">
<rect x="306.484375" y="45.375" width="57" height="57" rx="15.5" fill="url(#logo-fill)" stroke="${COLOR.accent}" stroke-opacity="0.188" stroke-width="1"/>
${icon("paintbrush", 317.984, 56.875, 34.008, 1.65)}
<text x="${middle}" y="152.875" text-anchor="middle" fill="${COLOR.title}" font-family="${FONT}" font-size="41.952px" font-weight="750" letter-spacing="-1.4px" textLength="${TITLE_WIDTH}" lengthAdjust="spacing">${escapeText(TITLE)}</text>
<text x="${middle}" y="184.109" text-anchor="middle" fill="${COLOR.tagline}" font-family="${FONT}" font-size="14px" font-weight="430">${escapeText(TAGLINE)}</text>
</g>
</g>
</svg>
`;
}

const here = path.dirname(fileURLToPath(import.meta.url));
const output = process.env.OUT ? path.resolve(process.env.OUT) : path.join(here, "..", "banner.svg");
writeFileSync(output, banner());
console.log(`Wrote ${path.relative(process.cwd(), output)}`);
