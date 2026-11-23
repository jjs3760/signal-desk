"""A reproducible next-session pullback scenario based on completed daily bars."""
from math import isfinite


def trade_plan(stock):
    bars = stock["bars"]
    ind = stock["indicators"]
    close = bars[-1]["close"]
    decimals = 0 if stock["currency"] == "KRW" else 2
    unit = "원" if decimals == 0 else "달러"

    def money(value):
        return f"{value:,.{decimals}f}{unit}"

    # Wilder's 14-session ATR, seeded with the first 14 true ranges.
    ranges = [max(b["high"], a["close"]) - min(b["low"], a["close"])
              for a, b in zip(bars, bars[1:])]
    if len(ranges) < 20 or not all(isfinite(v) and v >= 0 for v in ranges):
        return {"eligible": False, "reason": "유효한 일봉이 부족해 기준가를 산출할 수 없습니다."}
    atr = sum(ranges[:14]) / 14
    for value in ranges[14:]:
        atr = (13 * atr + value) / 14

    entry = round(ind["ma20"], decimals)
    stop = round(entry - 1.5 * atr, decimals)
    sell = round(max(b["high"] for b in bars[-20:]), decimals)
    plan = dict(eligible=False, date=bars[-1]["date"], atr=atr)
    if not 0 < stop < entry < sell:
        return {**plan, "reason": "20일 고점과 변동성으로 유효한 매수·손절·매도 구간을 구성할 수 없습니다."}
    ratio = (sell - entry) / (entry - stop)
    trend = close >= ind["ma20"] >= ind["ma60"]
    momentum = ind["macd"] >= ind["signal"]
    reasons = [
        f"종가 {money(close)}, 20일선 {money(ind['ma20'])}, 60일선 {money(ind['ma60'])}. "
        + ("중기 상승 추세 조건을 충족합니다." if trend else "종가 ≥ 20일선 ≥ 60일선 조건을 충족하지 못했습니다."),
        f"MACD {ind['macd']:,.2f}, 시그널 {ind['signal']:,.2f}. "
        + ("모멘텀 조건을 충족합니다." if momentum else "MACD가 시그널을 밑돌아 매수 확인이 필요합니다."),
        f"매수가 기준 상승 여력 {money(sell-entry)}, 손절까지 {money(entry-stop)}. "
        f"비용 전 손익비 {ratio:.2f}배로 최소 기준 1.50배를 " + ("충족합니다." if ratio >= 1.5 else "밑돕니다."),
    ]
    eligible = bool(trend and momentum and ratio >= 1.5)
    return {**plan, "eligible": eligible, "entry": entry, "stop": stop, "sell": sell,
            "ratio": ratio, "evidence": reasons, "reason":
            "상승 추세와 MACD, 손익비 조건을 충족해 20일선 눌림목을 검토합니다." if eligible else
            "관망합니다. 추세·모멘텀·손익비 중 미충족 조건을 아래에서 확인하세요."}
