"""Editorial watchlists; the third column describes the business exposure."""
SECTORS = {
    "반도체": [
        ("005930.KS", "삼성전자", "메모리·파운드리"), ("000660.KS", "SK하이닉스", "메모리·HBM"),
        ("NVDA", "엔비디아", "GPU·AI 가속기"), ("AMD", "AMD", "CPU·GPU"),
        ("AVGO", "브로드컴", "통신·네트워크 반도체"), ("MU", "마이크론", "메모리"),
        ("QCOM", "퀄컴", "모바일 반도체"), ("INTC", "인텔", "CPU·파운드리"),
        ("AMAT", "어플라이드 머티어리얼즈", "반도체 제조 장비"), ("LRCX", "램리서치", "식각·증착 장비")],
    "조선": [
        ("329180.KS", "HD현대중공업", "상선·특수선"), ("009540.KS", "HD한국조선해양", "조선 중간지주"),
        ("010140.KS", "삼성중공업", "선박·해양플랜트"), ("042660.KS", "한화오션", "상선·특수선"),
        ("097230.KS", "HJ중공업", "조선·건설"), ("071970.KS", "HD현대마린엔진", "선박 엔진"),
        ("082740.KS", "한화엔진", "선박 추진 엔진"), ("443060.KS", "HD현대마린솔루션", "선박 정비·개조"),
        ("014620.KQ", "성광벤드", "조선·플랜트용 관이음쇠"), ("HII", "헌팅턴 잉걸스", "군함 건조·정비")],
    "소프트웨어": [
        ("MSFT", "마이크로소프트", "업무용 소프트웨어·클라우드"), ("ADBE", "어도비", "콘텐츠 제작 소프트웨어"),
        ("CRM", "세일즈포스", "고객관계관리"), ("DDOG", "데이터독", "클라우드 모니터링"),
        ("INTU", "인튜이트", "세무·회계 소프트웨어"), ("NOW", "서비스나우", "업무 프로세스 관리"),
        ("ADSK", "오토데스크", "설계 소프트웨어"), ("CDNS", "케이던스", "전자 설계 자동화"),
        ("SNPS", "시놉시스", "반도체 설계 소프트웨어"), ("035420.KS", "NAVER", "인터넷 플랫폼·클라우드")],
    "방산": [
        ("012450.KS", "한화에어로스페이스", "항공우주·지상 방산"), ("272210.KS", "한화시스템", "방산 전자"),
        ("079550.KS", "LIG디펜스앤에어로스페이스", "방산 전자·항공우주"), ("047810.KS", "한국항공우주", "항공기 제조"),
        ("064350.KS", "현대로템", "지상 방산·철도"), ("LMT", "록히드 마틴", "항공우주·방위"),
        ("RTX", "RTX", "항공 엔진·방산"), ("NOC", "노스롭 그루먼", "항공우주·방위"),
        ("GD", "제너럴 다이내믹스", "함정·방산 시스템"), ("LHX", "L3해리스", "항공전자·통신")],
}

NYSE = {"HII", "CRM", "NOW", "LMT", "RTX", "NOC", "GD", "LHX"}
CATALOG = {}
for sector, entries in SECTORS.items():
    for symbol, name, business in entries:
        exchange = "KOSDAQ" if symbol.endswith(".KQ") else "KOSPI" if symbol.endswith(".KS") else "NYSE" if symbol in NYSE else "NASDAQ"
        code = symbol + ".O" if exchange == "NASDAQ" else symbol.split(".")[0]
        CATALOG[symbol] = dict(symbol=symbol, name=name, sector=sector, business=business,
                               exchange=exchange, code=code)
STOCKS = {s: item["name"] for s, item in CATALOG.items()}
