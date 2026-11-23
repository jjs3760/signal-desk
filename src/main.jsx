import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  AudioLines,
  CalendarDays,
  ChartNoAxesCombined,
  ChevronRight,
  CircleHelp,
  Gauge,
  Globe2,
  LayoutDashboard,
  Newspaper,
  PanelsTopLeft,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";
import "./style.css";

const fmt = (n, digits = 2) =>
  Number(n).toLocaleString("ko-KR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
const price = (n, currency) =>
  currency === "KRW" ? fmt(n, 0) + "원" : "$" + fmt(n);
function Change({ value }) {
  return (
    <span className={"change " + (value < 0 ? "down" : "up")}>
      {value >= 0 ? "▴ +" : "▾ "}
      {fmt(value)}%
    </span>
  );
}
function Spark({ bars, negative, id }) {
  const values = bars.slice(-32).map((b) => b.close),
    min = Math.min(...values),
    span = Math.max(...values) - min || 1;
  const d = values
    .map(
      (v, i) =>
        (i ? "L" : "M") +
        (i * 200) / (values.length - 1) +
        " " +
        (42 - (36 * (v - min)) / span),
    )
    .join(" ");
  const color = negative ? "#f18b96" : "#42d6ae";
  return (
    <svg
      className="spark"
      viewBox="0 0 200 50"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={id} x2="0" y2="1">
          <stop stopColor={color} stopOpacity=".25" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={d + " L200 50 L0 50Z"} fill={"url(#" + id + ")"} />
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
function Sentiment({ score }) {
  return (
    <div className="panel gauge">
      <div className="small">
        <Gauge size={16} /> 시장 심리 지수{" "}
        <span
          title="4개 지수의 RSI(14) 단순 평균"
          aria-label="4개 지수의 RSI 평균"
        >
          <CircleHelp size={14} />
        </span>
      </div>
      <svg viewBox="0 0 160 78" aria-hidden="true">
        <path
          d="M17 72 A63 63 0 0 1 143 72"
          pathLength="100"
          stroke="#353345"
        />
        <path
          d="M17 72 A63 63 0 0 1 143 72"
          pathLength="100"
          stroke="#aa8bff"
          strokeDasharray={score + " 100"}
        />
      </svg>
      <strong>
        {score}
        <small> / 100</small>
      </strong>
      <label>{score >= 60 ? "낙관" : score < 40 ? "비관" : "중립"}</label>
    </div>
  );
}
function Logo({ symbol }) {
  const id = symbol.split(".")[0];
  return (
    <span aria-hidden="true" className={"stocklogo s" + id}>
      {id === "NVDA" ? (
        <svg
          viewBox="0 0 48 36"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
        >
          <path d="M4 18Q20 0 40 12V7H24V3h20v27H24v-5Q12 27 4 18Z" />
          <path d="M12 18q12-13 22-1-9 11-18 2 6-7 12-2" />
        </svg>
      ) : id === "005930" ? (
        <i>SAMSUNG</i>
      ) : id === "MSFT" ? (
        <b className="ms">
          <i />
          <i />
          <i />
          <i />
        </b>
      ) : (
        id.slice(0, 2)
      )}
    </span>
  );
}
function CandleChart({ bars, count }) {
  const rows = bars.slice(-count),
    lo = Math.min(...rows.map((b) => b.low)),
    hi = Math.max(...rows.map((b) => b.high)),
    y = (v) => 112 - (104 * (v - lo)) / (hi - lo || 1),
    step = 550 / rows.length;
  return (
    <svg
      className="candles"
      viewBox="0 0 610 141"
      role="img"
      aria-label={
        rows[0].date + "부터 " + rows.at(-1).date + "까지의 일봉 차트"
      }
    >
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <line
            x2="550"
            y1={8 + (i * 104) / 3}
            y2={8 + (i * 104) / 3}
            stroke="#2a3140"
            strokeDasharray="3 4"
          />
          <text x="557" y={12 + (i * 104) / 3}>
            {fmt(hi - ((hi - lo) * i) / 3, hi > 999 ? 0 : 2)}
          </text>
        </g>
      ))}
      {rows.map((b, i) => {
        const x = (i + 0.5) * step,
          c = b.close >= b.open ? "#47d6ad" : "#f28a95";
        return (
          <g key={b.date} fill={c} stroke={c}>
            <title>
              {b.date} · O {b.open} H {b.high} L {b.low} C {b.close} V{" "}
              {b.volume}
            </title>
            <line x1={x} x2={x} y1={y(b.high)} y2={y(b.low)} />
            <rect
              x={x - step * 0.28}
              y={Math.min(y(b.open), y(b.close))}
              width={step * 0.56}
              height={Math.max(1, Math.abs(y(b.open) - y(b.close)))}
            />
          </g>
        );
      })}
      <text y="137">{rows[0].date}</text>
      <text x="550" y="137" textAnchor="end">
        {rows.at(-1).date}
      </text>
    </svg>
  );
}
function Detail({ s }) {
  const [count, setCount] = useState(20),
    [tab, setTab] = useState(s.score == null ? "기술 지표" : "분석 리포트");
  const ind = s.indicators;
  return (
    <section className="detail panel" id="detail">
      <div className="detailTop">
        <h2>
          <Activity /> 종목 상세 분석 <span className="muted">{s.name}</span>
        </h2>
        <div className="segments">
          {(s.score == null ? ["기술 지표"] : ["분석 리포트", "기술 지표"]).map((t) => (
            <button key={t} aria-pressed={t === tab} onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="detailGrid">
        <div>
          <div className="chartHead">
            <b>
              {s.symbol} <small>일봉</small>
            </b>
            <div className="segments">
              {[20, 60, 90].map((n) => (
                <button
                  key={n}
                  aria-pressed={n === count}
                  onClick={() => setCount(n)}
                >
                  {n}일
                </button>
              ))}
            </div>
          </div>
          <CandleChart bars={s.bars} count={count} />
        </div>
        <div className="report">
          {tab === "기술 지표" ? (
            <div className="metrics">
              {Object.entries({
                ma5: "MA 5",
                ma20: "MA 20",
                ma60: "MA 60",
                rsi: "RSI 14",
                macd: "MACD",
                signal: "시그널",
                upper: "밴드 상단",
                lower: "밴드 하단",
              }).map(([k, v]) => (
                <div key={k}>
                  <small>{v}</small>
                  <b>{fmt(ind[k])}</b>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="guides">
                <div>
                  <small>목표가 가이드</small>
                  <b className="up">{price(s.target, s.currency)}</b>
                </div>
                <div>
                  <small>손절가 가이드</small>
                  <b className="down">{price(s.stop, s.currency)}</b>
                </div>
              </div>
              <p>{s.reason}</p>
              <p className="risk">
                <TriangleAlert size={15} /> {s.risk}
              </p>
              {s.news?.slice(0, 2).map((n) => (
                <a key={n.url} href={n.url} target="_blank" rel="noreferrer">
                  {n.title}
                </a>
              ))}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
function Dashboard({ data }) {
  const ranked = data.ranked ?? true;
  const [selected, select] = useState(0),
    [page, setPage] = useState("desk");
  const time = new Date(data.asOf),
    date = time.toLocaleDateString("ko-KR", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    });
  return (
    <>
      <header>
        <div className="navwrap">
          <div className="brand">
            <span className="brandmark">
              <AudioLines size={24} />
            </span>
            Signal<span>Desk</span>
          </div>
          <nav>
            <button
              className={page === "desk" ? "active" : ""}
              onClick={() => setPage("desk")}
            >
              <LayoutDashboard />
              대시보드
            </button>
            <button
              className={page === "news" ? "active" : ""}
              onClick={() => setPage("news")}
            >
              <Newspaper />
              시장 뉴스
            </button>
          </nav>
          <span className="headerStatus">
            <i />
            {data.demo ? "가상 시세 · 데모" : "Yahoo Finance · 일봉"}
          </span>
        </div>
      </header>
      <main>
        <div className="eyebrow">
          <i /> MORNING BRIEFING
        </div>
        <div className="titleRow">
          <h1>{page === "desk" ? "마켓 대시보드" : "시장 뉴스"}</h1>
          <div className="date">
            <CalendarDays size={16} />
            {date}
          </div>
        </div>
        <p className="subtitle">
          {data.demo ? "데모 모드입니다. 모든 가격·추천은 가상의 예시입니다." : page === "desk" && !ranked
            ? "최근 마감 종가와 기술지표 · AI 추천 미생성" : page === "desk"
            ? "글로벌 시장 흐름과 AI가 선별한 오늘의 투자 시그널"
            : "최근 24시간 동안 수집된 글로벌 증시 주요 헤드라인"}
        </p>
        {page === "news" ? (
          <section className="panel news">
            <h2>
              <Newspaper /> 주요 헤드라인
            </h2>
            {data.news.length === 0 ? (
              <p>수집된 헤드라인이 없습니다.</p>
            ) : (
              data.news.map((n, i) => (
                <article key={i}>
                  <small>
                    {new Date(n.date).toLocaleString("ko-KR", {
                      timeZone: "Asia/Seoul",
                    })}{" "}
                    KST
                  </small>
                  <h3>
                    {n.url ? (
                      <a href={n.url} target="_blank" rel="noreferrer">
                        {n.title}
                      </a>
                    ) : (
                      n.title
                    )}
                  </h3>
                </article>
              ))
            )}
          </section>
        ) : (
          <>
            <div className="sectionHead">
              <h2>
                <Globe2 /> 글로벌 시장 현황
              </h2>
              <small>최근 거래일 종가 기준</small>
            </div>
            <div className="marketGrid">
              {data.markets.map((m, i) => (
                <article className="panel market" key={m.symbol}>
                  <div className="marketName">
                    <span className={"flag " + (i > 1 ? "kr" : "us")}>
                      {i > 1 ? "🇰🇷" : "🇺🇸"}
                    </span>
                    {m.name}
                  </div>
                  <strong>{fmt(m.price)}</strong>
                  <Change value={m.change} />
                  <Spark bars={m.bars} negative={m.change < 0} id={"m" + i} />
                  <small className="asof">{m.bars.at(-1).date}</small>
                </article>
              ))}
              <Sentiment score={data.sentiment} />
            </div>
            <div className="sectionHead picksHead">
              <h2>
                <Sparkles /> {ranked ? <>오늘의 AI 추천주 <em>TOP 3</em></> : "후보 종목 종가"}
              </h2>
              <small>{ranked ? "AI 점수순" : "동일 거래일 종가 대조"}</small>
            </div>
            <div className="stockGrid">
              {data.stocks.map((s, i) => (
                <button
                  className={"panel pick " + (selected === i ? "selected" : "")}
                  key={s.symbol}
                  aria-pressed={selected === i}
                  onClick={() => {
                    select(i);
                    document
                      .getElementById("detail")
                      ?.scrollIntoView({
                        behavior: "smooth",
                        block: "nearest",
                      });
                  }}
                >
                  {ranked && <div className="rank">
                    <span>RANK 0{i + 1}</span>
                    <span className="score">
                      <Sparkles size={13} /> AI 점수 <b>{s.score}</b>
                    </span>
                  </div>}
                  <div className="stockName">
                    <Logo symbol={s.symbol} />
                    <div>
                      <h3>{s.name}</h3>
                      <small>
                        {s.symbol} · {s.currency === "KRW" ? "KOSPI" : "NASDAQ"}
                      </small>
                    </div>
                  </div>
                  <div className="price">
                    <strong>{price(s.price, s.currency)}</strong>
                    <Change value={s.change} />
                  </div>
                  {s.reason && <p>{s.reason}</p>}
                  {s.verifiedBy && <p>Yahoo Finance · {s.verifiedBy} 종가 일치</p>}
                  <div className="cardfoot">
                    <span>{s.bars.at(-1).date} 종가</span>
                    <b>
                      상세 분석 <ChevronRight size={14} />
                    </b>
                  </div>
                </button>
              ))}
            </div>
            {data.excluded?.length > 0 && <p className="subtitle">종가 확인 보류 · {data.excluded.join(", ")}</p>}
            {data.stocks[selected] && <Detail
              key={data.stocks[selected].symbol}
              s={data.stocks[selected]}
            />}
          </>
        )}
      </main>
      <footer>
        <ShieldCheck size={15} />본 정보는 AI의 데이터 분석 결과이며 투자 권유가
        아닙니다
      </footer>
    </>
  );
}
async function load() {
  if (new URLSearchParams(location.search).get("demo") === "1")
    return (await fetch("/demo.json")).json();
  const response = await fetch("/latest.json", { cache: "no-store" });
  if (response.ok && response.headers.get("content-type")?.includes("json"))
    return response.json();
  if (
    response.status === 404 ||
    (response.ok && response.headers.get("content-type")?.includes("html"))
  )
    throw Error("저장된 시세가 없습니다. Python 수집기를 실행해 주세요.");
  throw Error("데이터를 불러오지 못했습니다.");
}
function App() {
  const [data, setData] = useState(null),
    [error, setError] = useState(false);
  useEffect(() => {
    load()
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);
  return data ? (
    <Dashboard data={data} />
  ) : (
    <main>
      {error
        ? <>{error} <a href="?demo=1">가상 데이터 데모 보기</a></>
        : "시장 데이터를 불러오는 중…"}
    </main>
  );
}
createRoot(document.getElementById("root")).render(<App />);
