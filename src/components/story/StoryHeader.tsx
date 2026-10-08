import type { StoryPayload } from "@/lib/schemas/story";
import { genres } from "@/lib/genres";
export function StoryHeader({ story, hasRequests }: { story: StoryPayload; hasRequests: boolean }) {
  return <header className="novel-header"><p className="eyebrow">AMGIPPANG ORIGINAL · {genres.find((genre) => genre.id === story.genre)?.name}</p><h1>《{story.title}》</h1><p className="novel-question">{story.drivingQuestion}</p><p className="novel-instruction"><span aria-hidden="true">*</span> 궁금한 장면의 작은 별표를 눌러 실제 개념을 확인하세요.</p>{hasRequests && <p className="novel-mock-note">입력한 추가 요청을 함께 전달해 만든 이야기예요.</p>}</header>;
}
