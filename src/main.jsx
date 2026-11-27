import React, { useEffect, useState } from "react";
import { topPick } from "./top-pick.js";
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
  Sun,
  Moon,
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
function directionClass(value) {
  if (value > 0) return "up";
  if (value < 0) return "down";
  return "flat";
}
function Change({ value }) {
  return (
    <span className={"change " + directionClass(value)}>
      {value > 0 ? "▴ +" : value < 0 ? "▾ " : ""}
      {fmt(value)}%
    </span>
  );
}
function Spark({ bars, change, id }) {
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
  const color = "currentColor";
  return (
    <svg
      className={"spark " + directionClass(change)}
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
          stroke="var(--border)"
        />
        <path
          d="M17 72 A63 63 0 0 1 143 72"
          pathLength="100"
          stroke="var(--accent)"
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
            stroke="var(--border)"
            strokeDasharray="3 4"
          />
          <text x="557" y={12 + (i * 104) / 3}>
            {fmt(hi - ((hi - lo) * i) / 3, hi > 999 ? 0 : 2)}
          </text>
        </g>
      ))}
      {rows.map((b, i) => {
        const x = (i + 0.5) * step;
        return (
          <g key={b.date} className={directionClass(b.close - b.open)} fill="currentColor" stroke="currentColor">
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
function TradeReport({ stock }) {
  const plan = stock.plan;
  if (!plan) return <p>이전 리포트입니다. 다음 시세 수집 후 가격별 산출 근거가 표시됩니다.</p>;
  const levels = [
    ["매수가", plan.entry, "20일 이동평균선 재접근 시 검토"],
    ["손절가", plan.stop, "매수가 − 14일 ATR × 1.5"],
    ["매도가", plan.sell, "최근 20거래일 장중 최고가"],
  ];
  return <>
    <small>{plan.date || stock.bars.at(-1).date} 종가 기준 · 다음 거래일 시나리오</small>
    <h3>{plan.eligible ? "조건부 매수 검토" : "관망"}</h3>
    <b>{plan.eligible ? "추천 이유" : "관망 이유"}</b>
    <p>{plan.reason}</p>
    {plan.entry != null && <>
      <div className="tradeLevels">{levels.map(([label, value, basis]) =>
        <div key={label}><small>{plan.eligible ? "추천" : "참고"} {label}</small>
          <strong>{price(value, stock.currency)}</strong><small>{basis}</small></div>
      )}</div>
      <p>14일 ATR {price(plan.atr, stock.currency)} · 손익비 {fmt(plan.ratio)}배</p>
      <ul>{plan.evidence.map(line => <li key={line}>{line}</li>)}</ul>
      <p>{plan.eligible ? "매수가 부근에서 지지를 확인하는 조건입니다. 가격이 도달하지 않으면 진입을 보류합니다." : "위 가격은 관망 사유를 점검하기 위한 참고 시나리오입니다."} 시초가 갭과 거래 비용에 따라 실제 손익은 달라질 수 있습니다.</p>
    </>}
    {stock.reason && <p><b>선정 의견</b> {stock.reason}</p>}
    {stock.risk && <p><b>위험 요인</b> {stock.risk}</p>}
    {stock.sourceUrl && <a href={stock.sourceUrl} target="_blank" rel="noreferrer">네이버증권 기준 시세</a>}
  </>;
}
function Detail({ s, id = "detail" }) {
  const [count, setCount] = useState(20),
    [tab, setTab] = useState("분석 리포트");
  const ind = s.indicators;
  return (
    <section className="detail panel" id={id}>
      <div className="detailTop">
        <h2>
          <Activity /> 종목 상세 분석 <span className="muted"><NewsOutlook stock={s}/>{s.name}</span>
        </h2>
        <div className="segments">
          {["분석 리포트", "기술 지표"].map((t) => (
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
            <TradeReport stock={s} />
          )}
        </div>
      </div>
    </section>
  );
}
function NewsOutlook({stock, details = false}) {
  const signal = stock.newsOutlook;
  const expiry = Date.parse(signal?.expiresAt);
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (!Number.isFinite(expiry)) return;
    const timer = setTimeout(() => setNow(Date.now()), Math.max(0, expiry - Date.now()) + 10);
    return () => clearTimeout(timer);
  }, [expiry]);
  if (!signal || !Number.isFinite(expiry) || Math.max(now, Date.now()) >= expiry) return null;
  const bearish = signal.direction === "down";
  if (bearish && stock.plan?.eligible !== false) return null;
  const label = bearish ? "👎 비추" : "👍 강추";
  const description = bearish ? "차트 관망 · 뉴스의 2주 이내 주가 하락 전망" : "뉴스의 2주 이내 주가 상승 전망";
  if (!details) return <span className="outlookBadge" data-down={bearish} title={description}>{label}</span>;
  const date = value => new Date(value).toLocaleString("ko-KR", {timeZone:"Asia/Seoul"});
  return <div className="outlookEvidence" data-down={bearish}><b>{label} · {description}</b>
    <p>{signal.evidence}</p><small>{date(signal.publishedAt)} 기사 · {date(expiry)} KST까지</small>
    <p><a href={signal.url} target="_blank" rel="noreferrer">{signal.source} 원문 보기</a></p></div>;
}
function CompanyNews({stock}) {
  return <section className="panel news"><h2><Newspaper/> {stock.name} 관련 뉴스</h2>
    <small>최근 7일 · 최대 3건</small>
    <NewsOutlook stock={stock} details/>
    {stock.news?.length ? stock.news.map(n => <article key={n.url}>
      <small>{n.source} · {new Date(n.date).toLocaleString("ko-KR",{timeZone:"Asia/Seoul"})} KST</small>
      <h3><a href={n.url} target="_blank" rel="noreferrer">{n.title}</a></h3>
      {n.summary && <p lang={n.language}>{n.summary}</p>}
    </article>) : <p>{stock.newsError ? "뉴스를 불러오지 못했습니다." : "최근 7일 동안 수집된 관련 기사가 없습니다."}</p>}
  </section>;
}
function relativeVolume(stock) {
  const bars = stock.bars?.slice(-21);
  if (bars?.length !== 21 || !bars.every(b => Number.isFinite(b.volume) && b.volume >= 0)) return null;
  const average = bars.slice(0, -1).reduce((sum, b) => sum + b.volume, 0) / 20;
  return average > 0 ? bars[20].volume / average : null;
}
function SectorDirectory({universe}) {
  const sectors = [...new Set(universe.map(s => s.sector))];
  const [sector, setSector] = useState(null);
  const [symbol, select] = useState(null);
  const rows = universe.filter(s => s.sector === sector)
    .map(stock => ({stock, ratio: relativeVolume(stock)}))
    .sort((a, b) => (b.ratio ?? -1) - (a.ratio ?? -1));
  const stock = rows.find(row => row.stock.symbol === symbol)?.stock;
  return <section className="directory">
    <div className="sectionHead"><h2><LayoutDashboard/> 업종별 후보 종목</h2><small>총 {universe.length}개</small></div>
    <div className="sectorButtons">{sectors.map(name => <button key={name} aria-pressed={name===sector}
        onClick={() => {setSector(name); select(null);}}>{name} <small>{universe.filter(s=>s.sector===name).length}종목</small></button>)}</div>
    {sector && <><h3>{sector} 후보 종목</h3>
      <p className="muted">최근 마감 거래량이 직전 20거래일 평균의 몇 배인지 보여줍니다. 배수가 높은 순서입니다.</p>
      <div className="sectorRows">{rows.map(({stock: s, ratio}) =>
      <button key={s.symbol} aria-pressed={symbol===s.symbol} onClick={() => {
        select(s.symbol); requestAnimationFrame(() => document.getElementById("sector-report")?.scrollIntoView({behavior:"smooth",block:"start"}));
      }}>
        <span><NewsOutlook stock={s}/><b>{s.name}</b><small>{s.symbol} · {s.exchange} · {s.business}</small></span>
        <span>{s.price != null ? price(s.price,s.currency) : "시세 확인 보류"}<small>{ratio != null ? `거래량 ${fmt(ratio)}배` : "거래량 비교 보류"}</small><small>관련 뉴스 {s.news?.length || 0}건</small></span>
      </button>)}</div></>}
    {stock && <div id="sector-report">{stock.plan ? <Detail id="sector-chart" key={stock.symbol} s={stock}/> :
      <p>{stock.name}의 마감 시세를 확인하지 못해 가격 분석을 보류했습니다.</p>}<CompanyNews stock={stock}/></div>}
  </section>;
}
function ThemePicker() {
  const [theme, setTheme] = useState(document.documentElement.dataset.theme);
  function choose(next) {
    document.documentElement.dataset.theme = next;
    setTheme(next);
    try {
      localStorage.setItem("signal-desk-theme", next);
    } catch {}
  }
  return (
    <div className="segments themePicker" role="group" aria-label="화면 테마">
      <button aria-pressed={theme === "light"} onClick={() => choose("light")}><Sun size={16} />밝게</button>
      <button aria-pressed={theme === "dark"} onClick={() => choose("dark")}><Moon size={16} />어둡게</button>
    </div>
  );
}
function Dashboard({ data }) {
  const pick = topPick(data);
  const koreanDay = new Intl.DateTimeFormat("en-CA", {timeZone:"Asia/Seoul"});
  const pickLabel = data.demo ? "예시 추천주" : koreanDay.format(new Date(data.asOf)) === koreanDay.format(new Date()) ? "오늘의 추천주" : "최근 리포트 추천주";
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
            {data.demo ? "가상 시세 · 데모" : data.source + " · 일봉"}
          </span>
          <ThemePicker />
        </div>
      </header>
      <main>
        <section className="briefing">
        <div className="eyebrow">
          <i /> MORNING BRIEFING
        </div>
        <div className="titleRow">
          <div className="dashboardHeading">
            <h1>{page === "desk" ? "마켓 대시보드" : "시장 뉴스"}</h1>
            {page === "desk" && <div className="headlinePick">
              <small>{pickLabel}</small>
              <strong>{pick?.stock.name ?? "없음"}</strong>
              {pick && <small>{pick.basis}</small>}
            </div>}
          </div>
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
        {data.publishedAt && <p className="subtitle published">최근 갱신 {new Date(data.publishedAt).toLocaleString("ko-KR",{timeZone:"Asia/Seoul"})} KST · 매일 오전 8:00 수집 · 8:30 게시 예정</p>}
        </section>
        {page === "news" ? (
          <section className="panel news">
            <h2>
              <Newspaper /> 미국·네이버 뉴스 요약
            </h2>
            {data.news.length === 0 ? (
              <p>수집된 헤드라인이 없습니다.</p>
            ) : (
              data.news.map((n, i) => (
                <article key={i}>
                  <small>
                    {n.region && `${n.region} · ${n.source} · `}
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
                  {n.summary && <p lang={n.language}>{n.summary}</p>}
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
                  <Spark bars={m.bars} change={m.change} id={"m" + i} />
                  <small className="asof">{m.bars.at(-1).date}</small>
                </article>
              ))}
              <Sentiment score={data.sentiment} />
            </div>
            {data.universe && <SectorDirectory universe={data.universe}/>}
            {(ranked || !data.universe) && <><div className="sectionHead picksHead">
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
                      <NewsOutlook stock={s}/><h3>{s.name}</h3>
                      <small>
                        {s.symbol} · {s.exchange || (s.currency === "KRW" ? "KOSPI" : "NASDAQ")}
                      </small>
                    </div>
                  </div>
                  <div className="price">
                    <strong>{price(s.price, s.currency)}</strong>
                    <Change value={s.change} />
                  </div>
                  {s.reason && <p>{s.reason}</p>}
                  {s.source && <p>{s.source} 일별시세 기준</p>}
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
            />}{data.stocks[selected] && <CompanyNews stock={data.stocks[selected]}/>}</>}
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
    return (await fetch(import.meta.env.BASE_URL + "demo.json")).json();
  const response = await fetch(import.meta.env.BASE_URL + "latest.json", { cache: "no-store" });
  if (response.ok && response.headers.get("content-type")?.includes("json"))
    {
      const data = await response.json();
      if (data.source !== "네이버증권") throw Error("네이버증권 시세 갱신이 필요합니다. 수집기를 실행해 주세요.");
      return data;
    }
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
    const refresh = () => load()
      .then(next => setData(old => old?.asOf === next.asOf ? old : next))
      .catch((err) => setError(err.message));
    refresh();
    const timer = setInterval(refresh, 60000);
    return () => clearInterval(timer);
  }, []);
  return data ? (
    <Dashboard data={data} />
  ) : (
    <main>
      <ThemePicker />
      {error
        ? <>{error} <a href="?demo=1">가상 데이터 데모 보기</a></>
        : "시장 데이터를 불러오는 중…"}
    </main>
  );
}
createRoot(document.getElementById("root")).render(<App />);
