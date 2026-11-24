export function topPick(data) {
  if (data.ranked ?? true) {
    const first = data.stocks[0];
    if (first && Number.isFinite(first.score)) {
      return { stock: first, basis: `AI 점수 ${first.score}점 · 1위` };
    }
  }
  const candidates = (data.universe ?? data.stocks).filter(
    stock => stock.plan?.eligible === true && Number.isFinite(stock.plan.ratio)
  );
  candidates.sort((a, b) => b.plan.ratio - a.plan.ratio || a.symbol.localeCompare(b.symbol));
  const stock = candidates[0];
  return stock ? { stock, basis: `조건부 매수 후보 중 손익비 1위 · ${stock.plan.ratio.toFixed(2)}배` } : null;
}
