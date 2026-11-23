"""Rebuild the explicitly synthetic example used by the dashboard."""
import json
import random
from pathlib import Path

import pandas as pd

from pipeline import INDICES, STOCKS, indicators


def sample(symbol, name, end_price, change, seed):
    rng = random.Random(seed)
    days = pd.bdate_range(end="2026-11-20", periods=160)
    value, rows = 100., []
    for _ in days:
        opening = value * rng.uniform(.995, 1.005)
        value = opening * rng.uniform(.988, 1.014)
        rows.append([opening, max(value, opening)*rng.uniform(1.002, 1.008),
                     min(value, opening)*rng.uniform(.992, .998), value, rng.randint(1000000, 4000000)])
    frame = pd.DataFrame(rows, index=days, columns=["Open", "High", "Low", "Close", "Volume"])
    for col in ["Open", "High", "Low", "Close"]:
        frame[col] *= end_price / (frame.Close.iloc[-2] * (1+change/100))
    frame.loc[days[-1], "Close"] = end_price
    frame.loc[days[-1], "High"] = max(frame.High.iloc[-1], end_price)
    frame.loc[days[-1], "Low"] = min(frame.Low.iloc[-1], end_price)
    bars = [dict(date=date.date().isoformat(), **{k.lower():round(float(v),2) for k,v in row.items()})
            for date,row in frame.tail(90).iterrows()]
    return dict(symbol=symbol, name=name, price=end_price, change=change, bars=bars,
                currency="KRW" if symbol.endswith(".KS") else "USD", indicators=indicators(frame))


markets = [sample(s,n,p,c,seed) for (s,n),(p,c,seed) in zip(INDICES.items(),[
    (6102.48,.84,44),(19864.32,1.26,52),(2734.61,.58,31),(849.72,-.37,65)])]
stocks = []
for i,(s,p,c,score,reason,risk) in enumerate([
        ("NVDA",138.72,2.34,94,"단기 이동평균선이 우상향하고 거래량이 늘면서 상승 흐름이 이어졌습니다.","반도체 업종 변동성 확대 시 단기 상승분을 반납할 수 있습니다."),
        ("005930.KS",75400,1.48,91,"중기 이동평균선 부근에서 매수세가 유입되며 기술적 반등 신호가 나타났습니다.","외국인 수급 변화와 원화 환율 변동에 민감합니다."),
        ("MSFT",428.56,.92,88,"안정적인 가격 추세와 MACD 개선이 중기 상승 흐름을 뒷받침합니다.","기술주 전반의 밸류에이션 조정이 하방 압력으로 작용할 수 있습니다.")]):
    stocks.append(dict(**sample(s,STOCKS[s],p,c,12+i),score=score,reason=reason,risk=risk,
                       target=round(p*1.08,2),stop=round(p*.95,2),news=[]))
snapshot = dict(demo=True,asOf="2026-11-23T07:30:00+09:00",markets=markets,stocks=stocks,
                sentiment=round(sum(m["indicators"]["rsi"] for m in markets)/4),
                news=[dict(title=t,date="2026-11-23T06:30:00+09:00",url=None) for t in
                      ["미국 기술주 강세와 반도체 업종 수급 점검", "국내 증시 개장 전 원화와 수출주 동향"]])
Path(__file__).resolve().parents[1].joinpath("public/demo.json").write_text(
    json.dumps(snapshot,ensure_ascii=False,allow_nan=False),encoding="utf-8")

