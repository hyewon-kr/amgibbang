import assert from "node:assert/strict";
import test from "node:test";
import { auditStory, commonSemanticConstraints, semanticConstraints, type ManualReview } from "../src/lib/evaluation/story-audit";
import { auditRequest } from "../src/lib/evaluation/request-audit";
import { mockStories } from "../src/lib/mock/stories";
import { mockAnalysis } from "../src/lib/mock/carbohydrate";
import { conformanceCases } from "./fixtures/conformance-cases";
import { validateAnalysis } from "../src/lib/generation/validate-analysis";
import { StoryGenreSchema } from "../src/lib/schemas/story";

const setup = { originalContent: "탄수화물", analysis: mockAnalysis, genre: "zombie_apocalypse" as const, userPriority: "", comprehensionNeeds: "" };

test("a zombie keyword and valid schema cannot certify genre semantics", () => {
  const story = structuredClone(mockStories.zombie_apocalypse);
  for (const chapter of story.chapters) {
    chapter.story = "좀비 이야기를 들었다. 모두 안전하게 수업을 들었다.";
    for (const mapping of chapter.mappings) mapping.storyExcerpt = chapter.story;
  }
  const report = auditStory(story, setup, []);
  assert.ok(report.automatic.every((c) => c.status === "pass"));
  assert.equal(report.verdict, "pending_review");
  assert.ok(report.semantic.every((c) => c.status === "pending"));
  const failed = auditStory(story, setup, [], [{ ruleId: "zombie.threat", status: "fail", reason: "키워드 존재는 실질적 위협을 입증하지 않음; 합성 부정 테스트", evidence: [{ chapterId: story.chapters[0].id, quote: "모두 안전하게 수업을 들었다." }] }]);
  assert.equal(failed.verdict, "failed");
});

test("automatic checks flag metadata, changed facts, absent terms and missing real annotations", () => {
  const story = structuredClone(mockStories.zombie_apocalypse);
  story.genre = "mystery";
  story.factAnchors[0].text = "Changed fact";
  const report = auditStory(story, setup, [{ label: "absent", aliases: ["unmentioned-concept"] }]);
  assert.equal(report.verdict, "automatic_failed");
  assert.ok(report.automatic.filter((c) => c.status === "fail").some((c) => c.id === "genre"));
  assert.ok(report.automatic.filter((c) => c.status === "fail").some((c) => c.id === "confirmed_facts"));
  const unmapped = structuredClone(mockStories.zombie_apocalypse);
  for (const chapter of unmapped.chapters) chapter.mappings = [];
  assert.equal(auditStory(unmapped, setup, []).verdict, "automatic_failed");
});

test("manual evidence must be exact and all rules reviewed before a pass", () => {
  const story = mockStories.zombie_apocalypse;
  assert.throws(() => auditStory(story, setup, [], [{ ruleId: "concept.identity", status: "fail", reason: "Unverified", evidence: [{ chapterId: 1, quote: "fabricated quote" }] }]), /evidence/);
  const evidence = [{ chapterId: story.chapters[0].id, quote: story.chapters[0].story.split("\n\n")[0] }];
  const reviews: ManualReview[] = [...commonSemanticConstraints, ...semanticConstraints.zombie_apocalypse].map((rule) => ({ ruleId: rule.id, status: "pass", reason: "Synthetic review fixture; not a real quality certification", evidence }));
  assert.equal(auditStory(story, setup, [], reviews.slice(1)).verdict, "pending_review");
  assert.equal(auditStory(story, setup, [], reviews).verdict, "passed");
});

test("request audit verifies every selected original, naming rules and reproducible request hash", async () => {
  for (const genre of StoryGenreSchema.options) {
    const a = await auditRequest({ ...setup, genre });
    const b = await auditRequest({ ...setup, genre });
    assert.ok(a.checks.every((c) => c.status === "pass"));
    assert.equal(a.instructionsSha256, b.instructionsSha256);
    assert.equal(a.originals.length, genre === "idol_entertainment" ? 2 : 1);
  }
  for (const c of conformanceCases) validateAnalysis(c.setup.analysis);
  assert.equal(conformanceCases.length, 4);
});
