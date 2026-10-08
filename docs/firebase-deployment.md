# Firebase App Hosting 배포 준비 상태

프로젝트: amgibbang-97a37 / 저장소: https://github.com/hyewon-kr/amgibbang / 브랜치: main / 앱 루트: /

현재 배포는 완료되지 않았다. Firebase CLI는 로그인되어 있고 프로젝트 조회에 성공했지만, App Hosting backend 조회에서 Blaze 전환 전 API 활성화 불가 오류가 발생했다. 공개 URL·Firebase build·production Firestore transaction·전체 장르 smoke test는 아직 검증하지 못했다.

## 설정

- apphosting.yaml: CPU 1, 메모리 1024MiB, minInstances 0, maxInstances 2, concurrency 4.
- Node 22. Next.js 동적 서버와 API Routes 유지, static export 없음. 자동 framework adapter 사용; 별도 build/run override 없음.
- next.config.ts에서 API bundle에 knowledge/**/*를 포함한다. 배포 후 원본 JSON/Markdown 및 golden examples의 실제 로드도 확인한다.
- .env.local / .env* / Firebase debug log / credential files는 Git 제외. .env.example에만 키 없는 예시를 유지한다.
- OPENAI_API_KEY → Cloud Secret Manager openai-api-key, RATE_LIMIT_SALT → rate-limit-salt. 두 값 모두 RUNTIME에서만 주입한다. 키는 빌드에 주입하지 않는다.
- OPENAI_MODEL=gpt-6.1-sol, RATE_LIMIT_BACKEND=firestore, API_DAILY_REQUEST_LIMIT=100.

Firebase 공식 문서는 Next.js framework adapter와 Node 22 이상을 안내하지만 현재 지원표의 active Next 버전은 15.2.x이다. Next 16.4는 이 표에 없으므로 Firebase adapter의 실제 build/rollout으로 호환성을 확인해야 한다. 임의로 Next 버전을 낮추지 않았다.

## 사용자 설정이 필요한 단계

1. Firebase 콘솔에서 amgibbang-97a37을 Blaze로 전환한다. 결제 정보 입력은 사용자 작업이다.
2. App Hosting에서 GitHub 연결을 승인하고 hyewon-kr/amgibbang만 선택한다. backend 생성: main, 루트 /, Node 22, 자동 rollout. 처음은 자동 즉시 rollout 대신 아래 secret/Firestore 설정 후 rollout 시작을 권장한다.
3. 기존 프로젝트 데이터베이스가 없다면 Firestore Native/Standard `(default)` 데이터베이스를 만든다. App Hosting 가까운 리전을 선택한다. 기존 데이터베이스가 있으면 먼저 rules를 검토한다. 동봉 firestore.rules는 새 전용 데이터베이스 기준 전체 client 접근 거부이므로 기존 앱의 rules를 무조건 덮어쓰지 않는다. 서버 SDK는 rules가 아니라 IAM을 따른다.
4. backend runtime service account에 Firestore 데이터 접근용 roles/datastore.user와 지정 secret 접근 권한을 부여한다. 서비스 계정 JSON 키는 만들지 않는다. 사용자 ADC 또는 firebase login만으로 Cloud Run 런타임 권한이 생기지는 않는다.
5. Secret Manager에 openai-api-key를 안전한 콘솔/CLI prompt로 입력한다. rate-limit-salt에는 32바이트 이상의 별도 난수를 사용한다. 키·salt를 GitHub secrets, issue, 로그, shell argument에 붙여넣지 않는다.

```sh
npx --yes --package firebase-tools firebase apphosting:secrets:set openai-api-key --project amgibbang-97a37
npx --yes --package firebase-tools firebase apphosting:secrets:set rate-limit-salt --project amgibbang-97a37
```

Secret을 콘솔에서 만들었다면 backend에 해당 secret 접근을 grantaccess한다. CLI의 권한 부여 prompt는 사용자가 확인한다.

```sh
npx --yes --package firebase-tools firebase apphosting:secrets:grantaccess openai-api-key --backend BACKEND_ID --project amgibbang-97a37
npx --yes --package firebase-tools firebase apphosting:secrets:grantaccess rate-limit-salt --backend BACKEND_ID --project amgibbang-97a37
```

6. 새 전용 DB이거나 기존 rules를 병합한 후 firestore rules/indexes를 배포한다. `amgippangApiLimits.expiresAt` TTL policy도 활성화됐는지 확인한다. TTL 삭제는 지연될 수 있지만 제한 판단은 expiresAt 삭제에 의존하지 않는다.
7. Cloud Run 서비스의 요청 timeout을 최소 360초로 확인/설정한다. Next route maxDuration만으로 Cloud Run timeout이 변경되는 것은 아니다.
8. 모든 설정 후 rollout을 시작한다. GitHub 자동 rollout은 Firebase App Hosting 연결이 담당한다. .github/workflows/ci.yml은 검증용이며 배포 credential을 요구하지 않는다. 자동 rollout이 GitHub CI 성공을 기다리는 것은 아니므로 main에 branch protection/필수 CI를 설정한다.

## 공개 API 보호와 비용

Firestore transaction이 IP별 bucket과 전체 UTC 일별 counter를 원자적으로 예약한다. 분석은 IP당 10분 6회, 이야기는 10분 5회, 두 route를 합쳐 IP당 한 개만 실행한다. 동일 route/body는 완료 후 15초 재호출을 차단한다. 최대 6분 lease로 crash 이후 잠금을 해제한다. 원문/IP는 저장하지 않으며 secret salt 기반 HMAC digest만 사용한다. 데이터베이스에 story 결과도 저장하지 않는다.

한 요청을 예약할 때 일일 카운트를 소진한다. 실패도 카운트에서 차감하지 않는다. Story 내부 형식 수정이 최대 1회 추가되어 예약 1건당 OpenAI 호출이 최대 2회일 수 있다. 100건은 달러 예산 한도가 아니며 필요하면 낮춘다. 다수 IP의 공격에도 전체 cap이 적용되지만 일반 이용자도 한도 도달 후 차단된다. Firestore 장애나 production 설정 누락 시 503으로 fail closed; mock fallback 없음.

Google LB의 X-Forwarded-For 마지막 두 값 중 client 위치를 사용한다. 맨 왼쪽의 임의 header를 신뢰하지 않는다. proxy chain이 다르거나 확인 불가하면 모든 미확인 요청이 보수적으로 동일 bucket을 공유한다. 실제 공개 URL에서 이 동작과 429/Retry-After를 반드시 검증한다. 직접 Cloud Run URL 및 다중 proxy의 IP별 식별은 추가 확인이 필요하며 전체 일일 cap은 이 식별과 독립적이다. Origin 검사는 auth를 대신하지 않는다.

요청 body는 streaming 단계에서 100,000 bytes까지 제한하고 Zod 검증 이후에만 Firestore 및 OpenAI를 호출한다. IP 제한은 완전한 봇 차단이 아니므로 더 큰 공개 운영에는 Firebase Auth/App Check/edge abuse protection을 검토한다. 이번 변경에서는 UI나 로그인 흐름을 추가하지 않았다.

Firebase 예산 알림과 App Hosting/Cloud Run spend cap을 설정한다. 공식 문서상 spend cap도 집계 지연으로 초과 비용이 발생할 수 있다. Firestore read/write, Secret Manager, build, network 등과 OpenAI API 비용은 별도다. Firebase spend cap은 OpenAI 비용을 막지 않는다. OpenAI 전용 프로젝트/key와 플랫폼 사용 한도·알림도 설정하고 API_DAILY_REQUEST_LIMIT과 함께 운영한다. 인스턴스 수 제한만으로 외부 API 사용량이 제한되지는 않는다.

## 공개 배포 후 검증

- HTTPS 공개 URL로 광합성 및 탄수화물 분석 HTTP 200, 실제 입력 반영.
- 분석 결과로 romance_fantasy / zombie_apocalypse / idol_entertainment / mystery / fantasy_academy 각각 생성, 선택 장르와 schema/참조 검증.
- Reader 연속 Chapter, 주석 펼침/접힘, Flow Summary 링크.
- 동시/중복/횟수 초과 429 + Retry-After, 큰 body 413, 잘못된 body 400.
- Firestore 잠금·카운터 및 IAM 동작 확인, secret이 client bundle/log에 없는지 확인.
- API 장애를 오류로 표시하며 mock으로 대체하지 않음.

공식 문서:
- https://firebase.google.com/docs/app-hosting/get-started
- https://firebase.google.com/docs/app-hosting/configure
- https://firebase.google.com/docs/app-hosting/frameworks-tooling
- https://firebase.google.com/docs/projects/billing/spend-caps
- https://docs.cloud.google.com/load-balancing/docs/https#x-forwarded-for_header
