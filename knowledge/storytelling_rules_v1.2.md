# 암기빵 Storytelling Generation Rules v1.2

## 1. 제품 방향
현재 핵심 생성 방식은 **Storytelling + Music**이다. Storytelling은 삽화 생성이 아니라 **Interactive Web**에서 경험하도록 설계한다.

1차 목표는 **이해(Comprehension), 몰입(Engagement), 재구연(Retellability)**이며 기억 지원은 2차 효과다.

> **Don't put information into a story. Find the story in the information first.**

## 2. Pipeline
**Input & Concept Extraction → User Confirmation → Genre Selection → Story Generation → Interactive Web Presentation**

## 3. Narrative Engine
단순 세계관 치환보다 아래 구조를 먼저 설계한다.

**Protagonist Desire → Motivation → Relationship → Conflict → Narrative Driving Question → Payoff**

### Character Motivation
주인공이 왜 목표를 반드시 달성하고 싶은지 초반에 납득 가능하게 제시한다. 동기는 Narrative Flavor여도 되지만 Fact와 혼동시키지 않는다.

### Relationship Continuity
조력자·동료·라이벌은 기능 수행 후 바로 폐기하지 않는다. 도움, 희생, 이별, 인계 등이 이후 사건에 감정적 의미를 남기게 한다.

## 4. 장르별 규칙

### 로맨스판타지
- Driving Question: **한계를 극복하고 목표한 신분·장소·인정을 얻을 수 있는가?**
- 재미: 욕망, 신분, 관계, 구원, 변신/각성, 인정
- 관계: 헌신적 조력자, 구원, 이별, 라이벌, 로맨틱 텐션
- 갈등: 관문, 신분 조건, 저주, 마법적 제약, 희생
- Payoff: 입궁, 각성, 인정, 구원
- 제목은 국내 로판 웹소설풍으로 짧고 강하게. 장황한 라이트노벨식 설명 제목은 피한다.

### 좀비 아포칼립스
- Driving Question: **다음 위험구역을 살아서 통과하고 안전지대에 도달할 수 있는가?**
- 재미: 생존, 긴박감, 위험구역 진행, 동료애, 희생
- 관계: 전우애, 희생, 불신→신뢰, 구조대 인계
- 갈등: 오염구역, 방역벽, 제한조건, 시간압박
- 고어 없이 긴장감을 만든다.

### 현대 인터넷소설
하나의 고정 schema보다 하위 장르별 Narrative Engine을 사용한다.

#### 아이돌/연예계
**데뷔 욕망 → 평가/라운드 → 프로듀서 → 위기 → 재편 → 최종평가 → 데뷔**

Driving Question: **다음 라운드를 통과하고 최종 데뷔할 수 있는가?**

빠른 대사, 업계 문법, 선후배·프로듀서·라이벌 케미, 결과 발표를 활용한다.

#### 추리
**Question → Evidence → Suspect → Contradiction → New Evidence → Reconstruction → Reveal**

Driving Question: **대체 무슨 일이 일어났으며 단서들을 어떻게 하나의 과정으로 재구성할 수 있는가?**

### 판타지 아카데미
- Driving Question: **시험·퀘스트를 어떤 지식과 능력으로 해결할 수 있는가?**
- 재미: 성장, 수업, 시험, 퀘스트, 규칙 발견, 숙련
- 관계: 교수-학생, 스승-제자, 라이벌, 파티
- 갈등: 단계별 시험, 금지구역, 마법 제약, 기존 능력의 한계
- 라이벌을 강제하지 않는다. **수업·시험 자체가 Narrative Engine**이 될 수 있다.

## 5. Structural Personalization
캐릭터 이름이나 배경만 바꾸는 Surface Personalization보다 **장르의 narrative schema와 원정보의 관계 구조를 대응시키는 Structural Personalization**을 우선한다.

## 6. Fact–Metaphor Separation
대사, 감정, 동기, 장르적 연출은 허용한다. 그러나 필수 사실, 인과, 단계 순서, 기능은 왜곡하지 않는다. Interactive Web에서 Narrative Flavor와 학술 Fact를 왕복할 수 있게 한다.

## 7. Quality Gate
우선순위:
1. Factual Fidelity
2. Relational Relevance
3. Comprehensibility
4. Narrative Coherence
5. Engagement
6. Retellability
7. Economy

Story에서는 Compression을 필수로 요구하지 않는다.

### Hard Reject
- 필수 인과/단계 순서 왜곡
- 단순 명사 치환만 존재
- 주인공 목표의 동기가 납득되지 않음
- fictional mapping 자체가 원정보보다 더 큰 학습 부담이 됨

## 8. Interactive Web
권장 구성:
- Genre Selector
- Scene / Chapter Navigation
- Fact Anchor Toggle
- Metaphor ↔ Fact Mapping
- Short Flow Summary
- 생성 전 Key Concept Confirmation

핵심은 **장르적 서사를 즐기면서 언제든 실제 학습 내용으로 돌아갈 수 있게 하는 것**이다.

## 9. Output
1. Title
2. Story
3. Fact Anchors & Mapping
4. Short Flow Summary
5. Interactive Web Payload

Canonical examples는 `example.md`를 참조한다.
