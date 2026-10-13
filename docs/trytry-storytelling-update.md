# trytry Storytelling 규칙 통합 — 2026-10-13

## 변경 범위

- `knowledge/storytelling_rules_v1.2.json`: 단일 최신 규칙 소스. 개념명 우선 인물화, 기능→행동, 개념 기반 사건·발견, 짧은 맥락 설명·세계 내부 메모, 개념 회수 결말, 장르별 다양성과 의미 보존. 변환에 따른 인물 정체성 변화는 캐릭터 연속성의 예외가 아니라 실제 기능에 따른 변화다.
- `knowledge/storytelling_rules_v1.2.md`: 활성 소스와 참조 구조 설명. 과거 Markdown/예시/override의 중복 지시를 생성 요청에 누적하지 않는다.
- `knowledge/trytry_codex_prompt.txt`, `trytry_golden_examples.txt`: 사용자가 제공한 파일을 내용 변경 없이 보관.
- `knowledge/trytry_golden_index.json`: 구현용 편집 요약과 출처 메타데이터. 채택 5편, 판타지 아카데미 후보 1편. 발췌/요약/선호 장면을 구분하고 전체 원문 미확보 상태를 유지한다.
- `src/lib/generation/knowledge-provider.ts`, `story-instructions.ts`, `openai-provider.ts`: 타입 검증된 JSON 로딩과 캐싱, 선택 장르만 전달, 짧은 참조 최대 2개. 분석 요청/모델/토큰 한도/재시도/보안은 그대로 유지.
- `src/lib/genres.ts`: 판타지 아카데미 표시명 복원. `fantasy_academy` API·세션 ID 유지. `schemas/story.ts`는 설명 주석만 수정.
- `tests/story.test.ts`, `story-instructions.test.ts`, `fixtures/story-quality-cases.ts`: 다섯 장르 계약·참조 출처·선택·토큰 증가 방지용 길이 한도 및 검토용 학습 사례.
- `scripts/story-quality-smoke.ts`: 명시적으로 실행하는 유료 실제 생성 검사. 기본은 다섯 사례, 인자로 특정 사례만 선택 가능. 일반 `npm run test`에서는 호출하지 않는다.

## 검증 결과

`npm run typecheck`, `npm run lint`(경고 없음), `npm run test`(30/30), `npm run build` 통과.

실제 OpenAI 생성은 gpt-6-luna로 검토된 분석을 재사용했다. 아래는 장르별 마지막 실행 시간이며, RAAS/면역/ECG는 후속 일반 규칙 보완 전의 결과다. 모든 결과는 스키마·참조 검증을 통과했고 입력 Fact Anchors를 그대로 보존했다. timeout/validation repair 없이 완료했다. 첫 5회 외 효소 저해 1회, 해당과정 2회를 문제 재검증에 사용했다. 분석 API나 공개 사이트 전체 흐름 테스트는 이번에 실행하지 않았다.

| 사례 | 장르 | 시간 | 주석 |
|---|---|---:|---:|
| RAAS | 로맨스판타지 | 18.4초 | 5 |
| 항원 인식 | 좀비 | 15.6초 | 4 |
| P/QRS/T | 아이돌 | 35.2초 | 3 |
| 경쟁적/순수 비경쟁적 저해 | 미스터리 | 28.8초 | 4 |
| 포도당→피루브산, ATP 수지 | 판타지 아카데미 | 23.8초 | 6 |

직접 읽은 결과: 개념명이 인물/직무로 나타나고 기능이 행동을 만든다. T세포의 peptide–MHC 인식 및 공동자극, ECG 전기활동과 수축의 구별, 경쟁적/순수 비경쟁적 Vmax·Km 구별, 포도당1→피루브산2와 ATP 투입2/생성4/순2가 연결된다. 해당과정 첫 결과의 변환 뒤 포도당 재등장 오류를 규칙 충돌 해소 후 마지막 실행에서 바로잡았다.

남은 한계: 스키마 성공은 서사/과학 해석의 완전한 성공을 보장하지 않는다. 일부 결과는 설명식 문장·대사가 많고 추리의 범인 공개가 약하다. 첫 RAAS에서는 안지오텐신 II의 등장 시점이 명확하지 않았다. 생성 시점·물질 정체성 규칙을 보완했으나 RAAS는 추가 호출하지 않았으므로 해소됐다고 단정하지 않는다. 짧은 다섯 사례 검증이며 긴 콘텐츠·사용자별 결과 품질은 일반화할 수 없다.

## 실행과 배포

실제 생성 재검사(서버 키가 담긴 로컬 환경파일이 필요하며 키를 출력하지 않음):

```sh
OPENAI_MODEL=gpt-6-luna node --env-file=.env.local --import tsx scripts/story-quality-smoke.ts
# 필요한 사례만: 뒤에 inhibition 또는 glycolysis 등의 ID를 추가
```

출력은 OS 임시 폴더의 `trytry-quality-<case>.json`에 저장되며 Golden 원문으로 분류하지 않는다. 이번 변경은 로컬에만 적용했다. GitHub push/Firebase 배포는 하지 않았다. API 출력 구조, 주석, Flow Summary, 입력/맞춤 설정 흐름, Firebase 설정과 Melody 관련 기능은 변경하지 않았다.
