# Story generation golden references — user-approved supplement

이 문서는 기존 storytelling_rules_v1.2.json / .md / example.md를 대체하지 않는 추가 reference이다. 최근 승인된 learning-first 방향에 맞춰 두 예시를 함께 판단한다. 사실 정확성과 입력의 Fact Anchor가 우선한다. 예시의 문장·설정·학습내용을 다른 주제에 복제하지 않는다.

## Golden Example A — 《황궁은 단당류만 받습니다》

본문은 함께 제공되는 example.md의 같은 제목 canonical example을 참조한다. 최신 사용자 승인 톤은 짧은 대사, lightly self-aware한 장르 연출, factual transition을 작은 사건으로 만드는 방식이다. 단당류 입장 조건, 산성 환경으로 끝나는 침 아밀레이스의 역할, 다음 조력자의 인계처럼 개념과 trope가 예상 밖으로 맞아떨어질 때 가벼운 유머를 사용한다. 농담이나 원문 대사를 그대로 반복하는 템플릿이 아니다.

## Golden Example B — 🏰 《말라가는 제국을 구하라》 — RAAS 로판 버전

오랜 가뭄으로 제국에 흐르는 **물이 줄어들기 시작했다.** 수도까지 들어오는 물길이 약해지자, 이를 가장 먼저 알아챈 것은 제국의 수원을 관리하는 **신장 공작가**였다.

'이대로라면 제국 전체의 수압이 무너지겠어.'

신장 공작가는 즉시 황실에 위기를 알리는 전령 **레닌**을 보냈다.

레닌은 황실에 잠들어 있던 **안지오텐시노겐**에게 도착해 봉인을 풀었다. 그러자 그에게서 첫 번째 모습인 **안지오텐신 I**이 나타났다.

하지만 아직 힘을 쓸 수는 없었다.

안지오텐신 I이 황궁으로 향하자 그곳의 **ACE**가 마지막 봉인을 풀었고, 마침내 강력한 **안지오텐신 II**로 변했다.

안지오텐신 II에게 주어진 명령은 하나였다.

> "제국의 압력을 다시 올려라."

그는 곧바로 두 가지 명령을 내렸다.

첫 번째는 **제국의 수로를 좁히는 것.**
넓게 열려 있던 혈관들이 수축하면서 같은 양의 피가 더 높은 압력으로 흐르기 시작했다.

하지만 그것만으로 부족했다.

안지오텐신 II는 이번에는 **알도스테론**에게 명령했다.

> "밖으로 빠져나가는 소금을 붙잡아. 물도 함께 제국 안에 남겨."

알도스테론의 명령으로 신장은 **Na⁺를 다시 거두어들였고 물도 함께 보존되었다.** 제국 안의 혈액량이 차오르기 시작했다.

**좁아진 혈관 + 늘어난 혈액량.**

마침내 떨어졌던 제국의 혈압이 다시 올라갔다.

## 두 예시에서 추상화할 생성 규칙

### 1. Source already contains the plot

Fiction을 만들기 전에 묻는다: "Does the learning content already contain a story?"
입력에서 누가 반응하는지, 무엇이 변하는지, 무엇 때문에 변하는지, 어떤 문제가 발생하는지, 어떤 작용이 이어지는지, 무엇이 해결되는지를 찾는다. 반응자·변환·trigger·constraint·작용·결과를 먼저 구성한다. 충분한 구조가 있다면 그 causal structure 자체를 plot으로 쓰고 그 구조를 사건의 뼈대로 삼고 인물의 선택·대사·장르 갈등을 자연스럽게 연결한다.

생성 순서: SOURCE STRUCTURE → GENRE REFRAMING → PLAYFUL NARRATIVE.
Fiction should fill narrative gaps, not replace the source structure.

### 2. Fictional causality mirrors factual causality

단순한 명사 대응보다 사건 사이의 연결이 대응해야 한다. RAAS의 감소→감지→레닌→안지오텐시노겐에서 Ang I 생성→ACE에 의한 Ang II 생성→혈관수축 및 알도스테론 분비 촉진→Na⁺·물 보존→혈액량/혈압 회복을 서사의 위기→감지→전령→변환→두 작용→회복과 대응시킨다. 실제 source의 분기·병렬·순환·피드백·필수 순서를 보존한다. 관계 구조가 다른 주제에 RAAS의 선형 구조를 강제로 적용하지 않는다.

예시의 황궁·봉인·명령은 비유다. ACE의 실제 위치, 효소 작용, Ang II 작용 등을 fictional geography나 인물의 의지로 설명하지 않는다. 이야기에서 두 작용을 차례로 소개했다고 실제로 혈관수축이 먼저 끝나거나 실패해야 알도스테론 작용이 시작된다는 조건을 추가하지 않는다. 이런 비유의 한계는 annotation에서 분명히 한다.

### 3. Source-grounded creative freedom
사건의 기전·선택·결과는 학습 구조에 연결한다. 인물의 케미, 오해, 유머, 세계관, 로맨스·정치·악역도 그 사건에 의미 있게 관여하면 허용한다. 개념과 무관한 독립 장편 subplot이나 장황한 설정으로 중심을 잃지 않는다. 불필요한 filler를 줄이는 것은 인물·재미·장르를 없애라는 뜻이 아니다.

### 4. Genre makes mechanisms entertaining
예시의 공작가·전령·봉인은 원정보의 관계를 기발하게 재표현한다. 가벼운 어휘 포장에 그치지 않고 선택 장르의 실제 사건과 인물 행동으로 발전시킨다. 예시의 목적지·문장·캐릭터를 복제하지 않는다. 의미 있는 로맨스, 실제 좀비, 업계 활동, 살인 수사, 마법 등 선택 장르의 정체성을 갖추되 정해진 장르 플롯을 강제하지 않는다.

### 5. Original terminology remains visible

레닌, 안지오텐시노겐, 안지오텐신 I, ACE, 안지오텐신 II, 알도스테론, Na⁺처럼 실제 학습용어를 본문에 남긴다. fictional nickname만 남기거나 실제 용어를 annotation에만 숨기지 않는다. 주요 작용과 변화도 본문에서 알아볼 수 있게 한다. 상세 사실은 annotation으로 보강한다.

### 6. Compression happens naturally

필요한 경우 결말에서 여러 작용이 어떻게 하나의 결과를 만드는지 짧게 회수한다. '좁아진 혈관 + 늘어난 혈액량'은 이 source의 두 기여를 회수하는 mental model이다. 모든 이야기에서 catchphrase·등식·요약 문구를 강제로 만들지 않는다. 압축 때문에 필수 사실·인과·정확한 값·기질 대응을 누락하지 않는다.

## Source에 맞는 reference 선택과 quality review

A의 강점: playful, lightly self-aware, genre cliché humor, fast pacing, factual transitions as small narrative events.
B의 강점: source-grounded causal narrative, extremely high factual relevance, almost no filler, structural analogy, original terminology preservation, concise causal payoff.

둘은 서로 보완하는 quality references다. 모든 Story를 A처럼 웃기게 하거나 B처럼 causal metaphor로 만들지 않는다. source의 관계 구조와 선택 장르에 맞게 각 강점을 활용한다. 웃음이 없는 짧은 causal narrative도 허용한다. humor는 concept–trope 대응에서 자연스럽게 생길 때 사용한다.

반환 전 확인:
- source 자체의 구조를 먼저 찾았는가?
- factual 관계와 fictional 관계의 causal correspondence가 유지되는가?
- 실제 용어가 본문에서 보이는가?
- source와 무관한 subplot/filler가 없는가?
- pacing과 genre wrapper가 개념 이해를 돕는가?
- payoff가 source의 결과를 짧게 회수하는가? 억지 catchphrase는 없는가?
- 사용자가 fictional lore보다 원래 학습 흐름을 다시 설명할 수 있는가?

목표는 '와, 웹소설 같다'보다 '이 개념을 이렇게 연결하니까 흐름이 이해된다'이다.
