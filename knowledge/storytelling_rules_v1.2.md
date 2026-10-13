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

#### 추리 - 탐정 범죄물
반드시 발생한 살인사건을 중심으로, 탐정이 조수와 회의적인 경찰 형사와 현장을 조사한다. 용의자/경쟁 가설, 증거와 증언의 모순, 결정적 단서, 논리적 재구성이 연결된 장면에서 전개된다. 고정된 챕터 공식은 아니다.
학습 개념은 단서와 증거를 해석하는 규칙이다. 친구들의 개념 토론이나 교실 퍼즐로 대체하지 않는다. 관찰과 선택이 수사를 바꾸고 결말은 이미 제시된 증거를 회수한다. 범인은 처음부터 공개하지 않되 범행 방법을 추적하는 구성은 예외다.
ECG 소견만으로 범죄·범인·사인을 입증하지 않는다. 의학적 판단의 한계와 독립적인 사건 증거를 구분하며 과학·법의학적 확실성을 발명하지 않는다. 실제 인과와 필수 순서를 보존한다. 기존 작품의 캐릭터·특정 플롯을 복제하지 않는다.

### 판타지 (기존 내부 ID: fantasy_academy)
- 마법 세계, 초자연적 힘, 전설 속 생물, 모험과 비범한 갈등을 표현한다.
- 영웅·기사·마법사·탐험가·소환사·평범한 인물 등에서 학습 구조에 맞는 주인공을 선택한다.
- 마법, 유물, 저주, 정령, 위험한 장소는 사건과 선택의 결과를 바꿔야 한다.
- 고정된 용 사냥·유물 탐색·퀘스트 공식을 강제하지 않는다.
- 아카데미는 선택적 배경이다. 수업·교수·시험·합격을 기본 진행 방식으로 사용하지 않는다.
- 원정보의 인과·순서·병렬 관계를 마법의 작용과 결과에 대응시키되 새로운 과학적 인과를 만들지 않는다.

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

## 10. 캐릭터 시스템 — 사용자 승인 추가 규칙
주인공 1명과 기본 주요 조연 1~3명의 이름·역할·성격·동기·관계·서사적 기능을 한 번의 생성 안에서 먼저 설계한다. 챕터마다 새 설명자를 등장시키지 않고, 반복 인물의 선택·협력·대립과 결과로 이야기를 전개한다. 이름과 관계의 변화에는 사건상 근거가 필요하다.
로판과 판타지는 서구풍/가상 이름, 아이돌은 자연스러운 한국식 이름/예명, 추리는 기본적으로 영국·유럽풍 이름(명시적 한국 배경 예외), 좀비는 선택한 지역·문화에 일관된 한국식 또는 서구식 이름을 사용한다. 실제 과학 용어는 이름 규칙으로 바꾸지 않는다.

## 11. 최신 필수 장르 정체성 — 사용자 승인
- 주인공과 이름 있는 상대의 중심 로맨스가 선택·갈등·관계 변화와 결말을 주도한다. 조력자 관계나 입궁 목표만으로 대체하지 않는다.
- 실제 좀비의 공격·추격·위협이 생존자의 상황과 선택을 반복적으로 바꾼다.
- 실제 아이돌 인물과 무대·공연·관련 행사가 사건과 결과에 관여한다.
- 실제 살인사건이 중심 사건이다. 주 탐정과 반복 등장하는 조수가 직접 수사한다. 절도·실종만으로 대체하지 않는다.
- 용사·마왕·마수·요정·용·정령 등에서 적절한 판타지 존재를 선택하고 실제 행동으로 사건을 바꾸게 한다. 전부 등장시키는 체크리스트는 아니다.
학습 사실과 인과는 보존하되, 장르 요소가 인물의 선택과 사건을 주도해야 한다. 단순 정보 정렬이나 장식적 명사는 충분하지 않다.
