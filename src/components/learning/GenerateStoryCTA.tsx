export function GenerateStoryCTA({ selected, busy, onGenerate }: { selected: boolean; busy: boolean; onGenerate: () => void; }) {
  return <div className="generate-story-row"><p className="muted">선택한 장르와 추가 요청으로 AI가 이야기를 만들어요.<br />생성에는 잠시 시간이 걸릴 수 있어요.</p><button className="primary-button" disabled={!selected || busy} onClick={onGenerate}>{busy ? "이야기를 펼치는 중…" : "스토리 생성하기"}<span aria-hidden="true">→</span></button>{!selected && <p className="select-hint">이야기 장르 하나를 선택해주세요.</p>}</div>;
}
