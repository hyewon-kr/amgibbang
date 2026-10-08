import type { Chapter, StoryPayload } from "@/lib/schemas/story";
export function FactNote({ id, mappings, facts }: { id: string; mappings: Chapter["mappings"]; facts: StoryPayload["factAnchors"]; }) {
  const ids = new Set(mappings.flatMap((m) => m.factAnchorIds));
  return <aside className="fact-note" id={id} aria-label="이 장면의 실제 개념"><h3><span aria-hidden="true">*</span> 이 장면의 실제 개념</h3>{facts.filter((f) => ids.has(f.id)).map((f) => <p className="note-fact" key={f.id}>{f.text}</p>)}{mappings.map((m, i) => <div className="note-mapping" key={i}><p>{m.explanation}</p>{m.metaphorLimit && <p className="note-limit">{m.metaphorLimit}</p>}</div>)}</aside>;
}
