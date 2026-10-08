import type { Chapter, StoryPayload } from "@/lib/schemas/story";
import { FactNote } from "./FactNote";
export function StoryAnnotation({ id, text, mappings, facts, open, onToggle, chapterTitle }: { id: string; text: string; mappings: Chapter["mappings"]; facts: StoryPayload["factAnchors"]; open: boolean; onToggle: (id: string) => void; chapterTitle: string; }) {
  return <div className={"passage-row" + (open ? " annotated" : "")}><p className={"novel-passage" + ((text.startsWith("“") || text.startsWith('"')) ? " dialogue" : "")}>{text}{mappings.length > 0 && <button className="annotation-trigger" aria-label={chapterTitle + (open ? " — 실제 개념 접기" : " — 실제 개념 펼치기")} aria-expanded={open} aria-controls={id + "-note"} onClick={() => onToggle(id)}><span aria-hidden="true">*</span></button>}</p>{mappings.length > 0 && open && <FactNote id={id + "-note"} mappings={mappings} facts={facts} />}</div>;
}
