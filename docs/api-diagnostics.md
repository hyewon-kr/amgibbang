# API 진단과 모델 변경

기존 “허용되지 않은 요청이에요”는 api-handler.ts의 Origin 검사에서 반환한 HTTP 403이다. OpenAI 호출·Structured Output parsing 전에 실패한다. 실제 브라우저 URL은 127.0.0.1:3000이며 동일 Origin 헤더를 넣은 curl로 403을 재현했다. Next가 재구성하는 request.url만 비교하지 않고 실제 HTTP Host를 사용하도록 수정했다. 외부 Origin은 계속 403으로 차단하며 회귀 테스트로 확인한다.

클라이언트 분석 body는 `{ input: state.originalContent }`, 서버 AnalyzeRequest는 `{ input: string }`이다. field mismatch는 없다. trim 후 빈 입력은 400으로 차단한다.

모델은 server-config.ts의 generationModel() 한 곳에서 OPENAI_MODEL 또는 gpt-6.1-sol 기본값을 읽는다. .env.local도 요청 모델로 변경했다. 두 route 모두 같은 설정을 쓴다. 클라이언트는 모델 설정을 갖지 않는다.

개발 로그 [generation]에는 route, HTTP status, category, OpenAI upstream status/type/code, redacted message, request ID, model, response status 및 Zod issue path/code만 기록한다. 요청 body·전체 학습내용·key·raw response는 기록하지 않는다. production에서는 진단 로그를 출력하지 않는다.

오류 code: origin_validation / input_validation / authentication / rate_limit / openai_api / timeout / configuration / structured_output / zod_validation / refusal / server_error. OpenAI response에 실제 refusal content가 존재할 때만 refusal로 처리한다. 인증·요청 실패·JSON parsing·Zod 형식 오류는 별도로 처리한다.

Responses API + zodTextFormat + responses.parse 유지. strict schema의 모든 필드는 required이며 metaphorLimit은 nullable string이다. narrative 응답에서 사실과 단계는 생성시키지 않고 분석 결과를 서버에서 붙인다. annotation 참조·exact excerpt·문단 연결과 Flow Summary를 검증한다. API 실패 시 mock fallback은 없다.

## 실제 검증 결과

- 광합성 /api/analyze: 동일 Origin 헤더로 HTTP 200. UI에서도 분석 성공.
- 탄수화물 /api/analyze: HTTP 200. UI에서도 분석 결과 확인.
- 광합성 romance_fantasy: UI → /api/story → StoryReader 《빛을 들이는 정원사》 3개 Chapter 렌더, 주석 펼침 확인.
- 탄수화물 romance_fantasy: /api/story 직접 요청 HTTP 200.
- 두 분석과 생성 모두 서버 Structured Output·Zod·참조 검증을 통과한 실제 API 결과이며 mock fallback 없음.
- typecheck / lint / build 성공, 회귀 테스트 16개 성공.
