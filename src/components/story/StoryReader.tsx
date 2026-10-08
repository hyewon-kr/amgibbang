import type { StoryPayload } from "@/lib/schemas/story";
import { StoryHeader } from "./StoryHeader";
import { StoryChapter } from "./StoryChapter";
import { FlowSummary } from "./FlowSummary";
export function StoryReader({ story, originalContent, hasRequests, openAnnotations, onToggle, onSetup, onRestart }: { story: StoryPayload; originalContent: string; hasRequests: boolean; openAnnotations: string[]; onToggle: (id: string) => void; onSetup: () => void; onRestart: () => void; }) {
  return <div className="novel-document"><div className="novel-topline"><button className="text-button" onClick={onSetup}>← 이야기 설정</button><span>AI STORY · 편하게 스크롤하며 읽어보세요</span></div><StoryHeader story={story} hasRequests={hasRequests} /><article aria-label={story.title}>{story.chapters.map((chapter, i) => <StoryChapter key={chapter.id} chapter={chapter} number={i + 1} facts={story.factAnchors} openAnnotations={openAnnotations} onToggle={onToggle} />)}</article><FlowSummary story={story} originalContent={originalContent} onSetup={onSetup} onRestart={onRestart} /></div>;
}
