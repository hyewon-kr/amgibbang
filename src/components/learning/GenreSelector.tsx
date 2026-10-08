import { genres } from "@/lib/genres";
import type { StoryGenre } from "@/lib/schemas/story";
export function GenreSelector({ selected, onSelect, disabled }: { selected: StoryGenre | null; onSelect: (genre: StoryGenre) => void; disabled: boolean; }) {
  const genre = genres.find((g) => g.id === selected);
  return <section className="setup-genres" aria-labelledby="genre-title"><h2 id="genre-title">어떤 이야기로 만나볼까요?</h2><div className="compact-genres" role="radiogroup" aria-labelledby="genre-title">{genres.map((item) => <label key={item.id} className={"compact-genre" + (selected === item.id ? " selected" : "")}><input type="radio" name="genre" value={item.id} checked={selected === item.id} disabled={disabled} onChange={() => onSelect(item.id)} /><span className="radio-mark" aria-hidden="true" /><span className="genre-copy"><strong>{item.name}</strong><span>{item.description}</span></span><span className="compact-status">AI</span></label>)}</div><div className="compact-feedback" aria-live="polite">{genre ? <p>{genre.name} 장르로 입력한 학습 내용을 이야기로 만들어요.</p> : <p>다섯 장르 중 마음이 가는 장르를 골라주세요.</p>}</div></section>;
}
