/**
 * tests/cssBlocksScreen.test.ts — the walk that reads only what can reach a
 * screen, and the media-query test it rests on.
 *
 * `eachScreenBlock` exists for one reader, `scanCalloutSurface`, which read
 * Ukiyo's `@media print` callout as the screen's and turned every callout with
 * a background of its own white. Every other reader keeps `eachBlock`, which
 * still walks into every at-rule: the studio weight has to outweigh a theme's
 * print-only `!important` too, because this plugin's stylesheet is printed.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { eachBlock, eachScreenBlock, neverOnScreen, stripComments } from "../src/manager/theme/cssBlocks";

function screenBlocks(css: string): Map<string, string> {
	const result = new Map<string, string>();
	eachScreenBlock(stripComments(css), (selector, body) => result.set(selector.trim(), body.trim()));
	return result;
}

function allBlocks(css: string): Map<string, string> {
	const result = new Map<string, string>();
	eachBlock(stripComments(css), (selector, body) => result.set(selector.trim(), body.trim()));
	return result;
}

describe("a media block that can never match a screen", () => {
	for (const atRule of [
		"@media print",
		"@media only print",
		"@media PRINT",
		"@media print and (orientation: landscape)",
		"@media print, speech",
		"@media not screen",
		"@media not all",
		"@media\nprint",
	]) {
		it(`is recognised: ${JSON.stringify(atRule)}`, () => {
			assert.equal(neverOnScreen(atRule), true);
		});
	}

	for (const atRule of [
		// A list matches when any of its queries does.
		"@media screen, print",
		"@media print, (max-width: 600px)",
		"@media screen",
		"@media only screen and (max-width: 600px)",
		"@media all",
		// No media type at all is `all`.
		"@media (max-width: 600px)",
		"@media (prefers-color-scheme: dark)",
		"@media not (hover: hover)",
		// `not` with a condition holds whenever the condition does not.
		"@media not print",
		"@media not screen and (max-width: 600px)",
		"@media not print and (min-width: 0)",
		// Not `@media` at all, or nothing to read.
		"@supports (display: grid)",
		"@layer base",
		"@container (min-width: 400px)",
		"@media-foo print",
		"@media",
		"@media print,",
	]) {
		it(`is not claimed: ${JSON.stringify(atRule)}`, () => {
			assert.equal(neverOnScreen(atRule), false);
		});
	}
});

describe("the screen walk", () => {
	it("leaves out a print block and keeps everything around it", () => {
		const css = `
			.callout { padding: 0; }
			@media print { .callout { background-color: #fff !important; } .print-only { color: #000; } }
			@media screen and (max-width: 600px) { .callout-title { padding: 2px; } }
			@supports (display: grid) { .callout-content { display: grid; } }
		`;
		const found = screenBlocks(css);
		assert.equal(found.get(".callout"), "padding: 0;");
		assert.equal(found.get(".callout-title"), "padding: 2px;");
		assert.equal(found.get(".callout-content"), "display: grid;");
		assert.equal(found.has(".print-only"), false);
		assert.equal(found.size, 3);
	});

	it("drops a print block nested in a style rule, with the declarations straight inside it", () => {
		// Native nesting: the print block's declarations would otherwise become
		// the parent's own, as the screen block's still do.
		const css = `.callout {
			padding: 0;
			@media print { background-color: #fff; & > .callout-title { color: #000; } }
			@media (max-width: 600px) { margin: 0; }
		}`;
		const found = screenBlocks(css);
		assert.equal(found.get(".callout")?.replace(/\s+/g, " "), "padding: 0; margin: 0;");
		assert.equal(found.has(".callout > .callout-title"), false);
		assert.equal(found.size, 1);
	});

	it("drops a print block wherever it sits, inside other at-rules too", () => {
		const css = `@supports (display: grid) { @media print { .a { color: red; } } .b { color: blue; } }`;
		assert.deepEqual([...screenBlocks(css).keys()], [".b"]);
	});

	it("leaves the ordinary walk exactly as it was: print rules included", () => {
		const css = `@media print { .callout { background-color: #fff !important; } } .b { color: blue; }`;
		assert.equal(allBlocks(css).get(".callout"), "background-color: #fff !important;");
		assert.equal(allBlocks(css).size, 2);
	});
});
