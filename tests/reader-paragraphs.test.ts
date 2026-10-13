import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { StoryChapter } from "../src/components/story/StoryChapter";
import { mockStories } from "../src/lib/mock/stories";

test("JSON paragraph breaks and within-paragraph newlines survive the reader", async () => {
  const story = mockStories.romance_fantasy;
  const text = '첫 행동과 그 반응.\n같은 문단의 다음 줄.\n\n"새 화자의 대사."\n\n또 다른 행동.';
  const chapter = JSON.parse(JSON.stringify({ ...story.chapters[0], story: text, mappings: [{ ...story.chapters[0].mappings[0], storyExcerpt: '"새 화자의 대사."' }] }));
  const html = renderToStaticMarkup(createElement(StoryChapter, { chapter, number: 1, facts: story.factAnchors, openAnnotations: [], onToggle: () => {} }));
  assert.equal((html.match(/class="novel-passage/g) || []).length, 3);
  assert.ok(html.includes("첫 행동과 그 반응.\n같은 문단의 다음 줄."));
  assert.equal((html.match(/class="annotation-trigger"/g) || []).length, 1);
  const css = await readFile("src/app/globals.css", "utf8");
  assert.match(css, /\.novel-passage\s*\{[^}]*white-space:pre-line/);
});
