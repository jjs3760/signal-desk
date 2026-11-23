# Signal Desk

매일 오전 7시 30분(Asia/Seoul)에 미국·한국 시장의 최근 마감 일봉과 24시간 뉴스를 분석하는 로컬 대시보드입니다.

## 아키텍처

```text
APScheduler (07:30 KST)
  ├─ yfinance → 지수 4개와 후보 6개 일봉 → pandas 보조지표
  └─ Google News RSS → 시장·종목별 헤드라인, 기사 시각과 링크
                       ↓
       Gemini generateContent → Pydantic 및 가격 범위 검증
                       ↓
       public/latest.json 교체 → React 대시보드
```

하루 한 번 생성되는 공통 리포트를 JSON 파일로 제공합니다. 방문자가 늘어도 데이터 공급자나 모델 호출 횟수는 늘지 않습니다. 필요한 서비스는 Python 배치 프로세스와 정적 웹 서버입니다. API 키는 Python 환경에서만 읽습니다.

## 대시보드 실행

프로젝트 루트에서 Node.js 22.12 이상을 사용합니다. PowerShell 예시입니다.

```powershell
npm.cmd ci
npm.cmd run dev
```

터미널의 로컬 주소를 여세요. 첫 실행에는 public/demo.json의 고정된 합성 시세, 임의 점수와 예시 뉴스를 표시합니다. 수집에 성공하면 다음 페이지 로드부터 실제 결과와 생성일이 표시됩니다. 카드 가격은 해당 거래소의 마지막 마감 종가이며 통화는 USD 또는 KRW입니다.

## 실제 수집 및 AI 분석

Python 3.11 이상과 Gemini API 키, 해당 계정에서 generateContent와 구조화 출력을 지원하는 모델 ID가 필요합니다.

```powershell
py -3 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend/requirements.txt
$env:GEMINI_API_KEY = Read-Host "Gemini API 키" -MaskInput
$env:GEMINI_MODEL = Read-Host "사용할 Gemini 모델 ID"
.\.venv\Scripts\python.exe backend/pipeline.py
.\.venv\Scripts\python.exe backend/pipeline.py --schedule
```

-MaskInput은 PowerShell 7.1 이상에서 지원합니다. Windows PowerShell 5.1에서는 사용자 환경 변수 편집기에서 GEMINI_API_KEY를 설정한 뒤 새 터미널을 여세요. 한 번 실행하는 명령은 즉시 리포트를 생성합니다. 스케줄 모드는 매일 지정 시각에 실행되며 해당 프로세스와 컴퓨터가 켜져 있어야 합니다. 서버에서는 프로세스 관리자에 등록하거나 시스템 스케줄러로 일회 실행 명령을 호출할 수 있습니다.

## 산출 기준

- S&P 500, NASDAQ Composite, KOSPI, KOSDAQ와 후보 종목 6개를 backend/pipeline.py에 정의했습니다. 미국은 뉴욕, 한국은 서울 시간으로 당일 마감 전 일봉을 제외합니다. 휴장일에는 가장 최근 거래일을 사용합니다.
- 약 1년의 OHLCV로 SMA(5·20·60), Wilder RSI(14), MACD(12·26·9), 볼린저 밴드(20일 평균 ± 모집단 표준편차 2배)를 계산합니다. 지표와 차트의 가격 기준은 Yahoo의 Close입니다. 배당 재투자 수익률은 포함하지 않습니다.
- 시장 심리 점수는 네 지수 RSI의 단순평균을 반올림한 자체 지표입니다. 40 미만은 비관, 60 이상은 낙관입니다. 개별 종목 AI 점수는 후보 사이의 상대 평가입니다.
- 시장과 각 후보의 최근 뉴스 최대 4건, 기술지표, 최근 10거래일 OHLCV를 모델에 전달합니다. 정확히 3개 후보의 중복 여부, 정수 점수 0~100, 양수 손절가 < 종가 < 목표가를 검증합니다.
- 후보 시세 수집 실패 시 해당 종목을 제외합니다. 유효 후보가 3개 미만이거나 지수·뉴스 요청·AI 결과 검증이 실패하면 배치를 중단하고 마지막 성공 파일을 유지합니다. 뉴스가 0건인 경우 빈 목록이 전달됩니다.
- 사이트는 종목 선택, 20·60·90거래일 차트, 상세 리포트·기술지표 탭, 시장 뉴스와 고정 면책 문구를 제공합니다.

## 빌드 및 운영

```powershell
npm.cmd run build
$env:SNAPSHOT_PATH = Join-Path (Resolve-Path dist) 'latest.json'
.\.venv\Scripts\python.exe backend/pipeline.py --schedule
```

정적 서버의 루트를 dist로 지정합니다. 같은 호스트의 배치가 SNAPSHOT_PATH에 쓸 수 있어야 하며 다른 호스트나 CDN을 사용하면 배치 성공 후 latest.json을 웹 루트에 업로드해야 합니다. latest.json에는 캐시 재검증을 적용하세요. 재빌드 시 dist가 재생성되므로 마지막 성공 파일을 보존해 복원하거나 별도 저장소에서 제공합니다.

대시보드와 카드, 차트 컴포넌트는 src/main.jsx에, 반응형 스타일은 src/style.css에 있습니다. 샘플을 재생성하려면 가상환경에서 python backend/demo.py를 실행하세요.

시세와 모델 응답 형식의 공식 문서를 참고하세요. [yfinance history](https://ranaroussi.github.io/yfinance/reference/api/yfinance.Ticker.history.html) · [Gemini 구조화 출력](https://ai.google.dev/gemini-api/docs/structured-output)

