# 암기빵 · Interactive Web Novel prototype

Next.js App Router + TypeScript. OpenAI API·DB 없이 탄수화물 소화의 원본 예시를 장면 중심으로 확장한 mock입니다.

## 실행

```sh
npm ci
npm run dev
```

http://127.0.0.1:3000 에서 확인합니다. Node.js 20.9 이상을 사용합니다.

```sh
npm run lint
npm run typecheck
npm run test
npm run build
```

## 두 개의 주요 화면

**PAGE 1 — Story Setup**

처음에는 학습 입력만 보여줍니다. 내용 분석을 누르면 이동 없이 아래에 분석·추가 요청·장르 선택·생성 CTA가 펼쳐집니다.

- LearningInput: 학습 내용과 ‘내용 분석하기’.
- AnalysisSummary: ‘이 내용은 이렇게 이해했어요’, ‘핵심은 이거예요’, ‘핵심 흐름’.
- AdditionalRequests: optional userPriority / comprehensionNeeds. 두 필드 모두 비워두고 진행 가능합니다.
- GenreSelector: 동등한 다섯 장르, compact한 라디오 선택. 다섯 장르 모두 canonical mock Story를 제공합니다. 선택한 장르가 그대로 Reader에 연결됩니다.
- GenerateStoryCTA: ‘스토리 생성하기 →’. 이 동작만 Reader로 이동합니다.

분석의 internal Fact·Step·인과·필수 순서는 기본 UI에 표시하거나 편집을 요구하지 않습니다. 분석 요약은 효소의 장소별 역할 인계, 환경의 제약, 분해→흡수→이동의 관계를 설명합니다. 실제 AI 분석은 연결되지 않았고 화면에 mock임을 알립니다.

**PAGE 2 — Story Reader**

- StoryHeader: 제목과 Driving Question, 작은 주석 안내.
- StoryChapter: 모든 Chapter를 한 document에 순서대로 렌더링.
- StoryAnnotation: mapping의 storyExcerpt가 포함된 문단에 * trigger.
- FactNote: 관련 Fact Anchor와 대응 설명, 작은 비유 한계 안내.
- FlowSummary: 마지막 Chapter 아래의 ‘이제 원래 내용을 다시 볼까요?’ 및 원내용·흐름 요약.

Previous/Next, Chapter pagination, Chapter X/Total, Chapter progress, 별도 Completion 화면을 제거했습니다. 사용자는 세로 스크롤만으로 전체 Story를 읽습니다.

## 주석

- mapping이 존재하는 문단에만 별표를 배치합니다. 같은 문단의 mappings는 하나의 trigger로 묶습니다.
- 주석 trigger 수: 로맨스판타지 5 / 좀비 아포칼립스 5 / 아이돌·연예계 5 / 추리 6 / 판타지 아카데미 5. 같은 문단의 복수 매핑을 하나의 trigger로 묶습니다.
- 기본은 모두 닫힘입니다. 클릭·탭·키보드 Enter/Space로 독립적으로 열고 다시 닫습니다.
- 데스크톱의 넓은 화면에서는 margin note, 1150px 이하에서는 해당 문단 바로 아래에 표시합니다.
- Story text를 대체하거나 숨기지 않습니다.
- aria-expanded / aria-controls와 구체적인 accessible label을 제공합니다.
- Flow item은 링크로 해당 Chapter 제목까지 스크롤하고 포커스를 이동합니다. reduced-motion에서는 즉시 이동합니다.

## 데이터·상태 흐름

AnalysisPayload의 정확한 계약: src/lib/schemas/analysis.ts

```ts
type AnalysisPayload = {
  userFacing: {
    summary: string;
    coreConcept: string;
    coreFlow: string[];
  };
  internal: {
    factAnchors: FactAnchor[];
    steps: Step[];
    causalRelations: CausalRelation[];
    requiredOrder: string[]; // Step IDs in required process order
  };
};
```

StoryPayload는 기존 strict Zod 계약을 유지합니다. schemaVersion 1.0 / rulesVersion 1.2, 다섯 독립 장르, title, drivingQuestion, narrativePlan, steps, factAnchors, chapters와 mappings, flowSummary를 포함합니다. subgenre는 없습니다. narrativePlan과 internal 분석은 사용자에게 직접 노출하지 않습니다.

useReducer는 screen: setup | reader, originalContent, analysis, userPriority, comprehensionNeeds, genre, story, openAnnotations, ready만 관리합니다. Chapter index·다음/이전 action·별도 완료 상태·수동 확정 상태를 제거했습니다.

- 입력 변경은 오래된 분석·Story·주석을 무효화합니다.
- 추가 요청과 장르 변경은 이전 Story를 무효화합니다.
- 분석 후 같은 화면을 유지하며 분석 제목에 포커스를 이동합니다.
- 생성 시 LearningProvider.createStory(setup)에 원문·분석·두 추가 요청·장르를 전달합니다.
- 현재 provider는 고정 원본 예시를 반환하므로 추가 요청을 실제 본문에 반영하지 않습니다. 생성 CTA와 Reader에 이를 명시합니다.
- sessionStorage의 amgippang.mock.v2에 저장하고 schema·참조 검증 후 복원합니다. 구버전 흐름은 복원하지 않습니다.
- 새 학습 시작 시 초기화합니다. 스토리지 접근이 불가능해도 흐름은 동작합니다.
- 브라우저 URL은 / 하나이고, 인식되는 주요 화면은 두 개입니다.

## Mock과 원본 규칙

src/lib/mock/carbohydrate.ts에는 공통 user-facing summary와 internal 분석이 있습니다. src/lib/mock/backbone.ts의 동일한 Fact Anchor와 Steps를 다섯 Story가 공유합니다. 각 Story는 src/lib/mock/stories/ 아래 독립 파일로 관리합니다. 사용자 요청에 따라 원본 설정을 장면·대화·관계 중심으로 확장했습니다. 공통 Fact와 Steps는 변경하지 않았으며 스키마·참조·동일 사실 테스트로 확인합니다. 서사 검토는 docs/narrative-quality-review.md에 기록합니다.

knowledge/의 원본 JSON·Markdown·example은 내용 변경 없이 보존합니다. 사용자 승인 장르 변경은 genre_structure_override.json과 knowledge-provider.ts에서 적용합니다.

독립 장르: romance_fantasy / zombie_apocalypse / idol_entertainment / mystery / fantasy_academy.

## 향후 OpenAI 연결

LearningProvider.analyze(input) → AnalysisPayload와 createStory(setup) → StoryPayload 계약을 유지합니다. /api/analyze와 /api/story 서버 route를 추가하고 mock provider를 API provider로 교체합니다.

서버에서만 OPENAI_API_KEY를 읽습니다. knowledge-provider.ts로 원본 규칙·예시와 장르 override를 읽고, userPriority는 포함·강조 요구로, comprehensionNeeds는 관계·개념의 설명을 보강하는 요구로 프롬프트에 전달합니다. 구조 검증 외 인과·순서·서사 의미의 품질 검증을 추가합니다. Experience component는 payload의 표현에 집중합니다.

## 이번 수정 파일

수정:
- src/components/learning/LearningInput.tsx
- src/components/learning/GenreSelector.tsx
- src/components/story/StoryReader.tsx
- src/features/learning-flow/LearningFlow.tsx
- src/features/learning-flow/reducer.ts
- src/features/learning-flow/session.ts
- src/lib/schemas/analysis.ts
- src/lib/generation/provider.ts
- src/lib/generation/mock-provider.ts
- src/lib/generation/validate-analysis.ts
- src/lib/mock/carbohydrate.ts
- src/lib/genres.ts
- src/app/globals.css
- tests/story.test.ts
- README.md

추가:
- src/components/learning/AnalysisSummary.tsx
- src/components/learning/AdditionalRequests.tsx
- src/components/learning/GenerateStoryCTA.tsx
- src/components/story/StoryHeader.tsx
- src/components/story/StoryChapter.tsx
- src/components/story/StoryAnnotation.tsx
- src/components/story/FactNote.tsx
- src/components/story/FlowSummary.tsx

삭제:
- src/components/learning/ConceptReview.tsx
- src/components/story/ChapterProgress.tsx
- src/components/story/FactPanel.tsx
- src/components/story/StoryCompletion.tsx

## 검증

- lint / typecheck 통과.
- 회귀 테스트: 확장된 Story의 원본 제목·공통 사실 보존, 참조·매핑 유효성, 장르 일관성, 내부 분석 순서 검증, 두 화면 상태 전환·주석 토글, 새 세션 복원, 문단별 매핑 밀도.
- 브라우저 검사: 데스크톱 1440px / 모바일 390px, 같은 화면 분석, optional 입력, 다섯 장르 선택·생성, 연속 전체 Chapter, 주석 펼침·접힘, margin/inline 위치, Flow 링크, 요청 보존, 세션 복원, 빈 optional로 생성, 초기화·입력 변경.
- Google Fonts를 불러오며 연결이 없으면 시스템 한국어 폰트로 대체됩니다.

기존 설치의 npm audit에서는 개발용 ESLint의 braces → micromatch → fast-glob 의존성에 high 5건이 보고되었습니다. 자동 수정이 Next ESLint 설정 다운그레이드를 요구하므로 강제 적용하지 않았습니다.

## 다섯 장르 비교 mock

| 장르 | 파일 | Chapter | 주석 trigger |
| --- | --- | ---: | ---: |
| romance_fantasy | src/lib/mock/stories/romance-fantasy.ts | 4 | 5 |
| zombie_apocalypse | src/lib/mock/stories/zombie-apocalypse.ts | 4 | 5 |
| idol_entertainment | src/lib/mock/stories/idol-entertainment.ts | 4 | 5 |
| mystery | src/lib/mock/stories/mystery.ts | 4 | 6 |
| fantasy_academy | src/lib/mock/stories/fantasy-academy.ts | 4 | 5 |

index.ts의 mockStories는 Record<StoryGenre, StoryPayload> 타입으로 다섯 장르를 빠짐없이 연결합니다. mockProvider.createStory는 structuredClone(mockStories[setup.genre])를 반환합니다. 준비 중 상태나 로맨스판타지 fallback은 없습니다. StoryPayload는 장르별로 독립적이며 4개의 극적 장면으로 구성합니다. 본문은 약 2,500~2,600자이며 욕망·관계·제약·결말을 narrativePlan과 함께 확장했습니다. UI와 schema는 유지합니다.

create-story.ts는 공통 사실·단계·요약 흐름을 붙이고 해당 단계가 있는 실제 Chapter ID를 연결합니다. 각 genre의 storyExcerpt에 같은 Anchor ID를 매핑합니다. 원본 제목 유지, 동일한 factual backbone, 장르별 provider 분기, 동일한 위 사실의 서로 다른 장르 발췌를 tests/genres.test.ts에서 검증합니다.

이번 추가 변경: backbone.ts / stories/*.ts / tests/genres.test.ts 추가, carbohydrate.ts에서 로판 분리, mock-provider.ts·genres.ts·GenreSelector.tsx·GenerateStoryCTA.tsx·LearningFlow.tsx·StoryHeader.tsx·StoryAnnotation.tsx·FlowSummary.tsx·tests/story.test.ts 수정. Reader·화면 구조는 동일합니다.

## OpenAI API 연결 (현재 실행 경로)

현재 UI는 apiProvider → `/api/analyze`, `/api/story` → 서버 openaiProvider를 사용합니다. 위의 mock 설명은 보관된 비교 데이터에 대한 설명이며 실행 시 mock fallback을 사용하지 않습니다.

`.env.local`에 `OPENAI_API_KEY`를 설정합니다. 선택적으로 `OPENAI_MODEL`을 설정하며 기본값은 `gpt-6.1-sol`입니다. 키를 바꾼 후 개발 서버를 재시작합니다. `.env.example`은 키 없는 설정 예시입니다. 키는 클라이언트 환경변수에 넣지 않습니다.

Responses API의 Structured Outputs와 기존 Zod 스키마를 사용합니다. knowledge 원본 규칙·가이드·canonical examples와 승인된 장르 override를 서버에서 읽습니다. 입력 주제와 추가 요청을 전달하며, 예시의 탄수화물 사실을 다른 주제에 강제로 적용하지 않습니다. Story의 Fact Anchor와 Steps는 분석 결과에서 서버가 직접 붙이고 Flow Summary를 사실 순서대로 구성합니다. 주석·ID 참조·누락·문단 위치를 검증합니다. 구조 검증은 내용의 과학적 정확성을 보장하지 않으므로 AI 분석과 생성 내용은 사용자 검토가 필요합니다.

오류·거부·시간 초과·한도 초과에는 메시지를 표시하고 이전 mock으로 대체하지 않습니다. 입력은 최대 12,000자, 추가 요청은 각 2,000자입니다. API 응답 저장은 `store: false`, 요청 시간 제한은 150초입니다. 공개 배포 전에는 인증과 서버 요청 제한을 추가해야 합니다. 기존 브라우저 세션에는 이전 mock이 남아 있을 수 있으므로 새 학습을 시작해 실제 분석을 요청합니다.
