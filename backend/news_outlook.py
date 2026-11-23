"""Recognize explicitly time-bounded stock-price forecasts in collected news."""
import re
from datetime import datetime, timedelta

ENGLISH_NAMES = {
    "NVDA":"Nvidia", "AMD":"Advanced Micro Devices", "AVGO":"Broadcom", "MU":"Micron",
    "QCOM":"Qualcomm", "INTC":"Intel", "AMAT":"Applied Materials", "LRCX":"Lam Research",
    "HII":"Huntington Ingalls", "MSFT":"Microsoft", "ADBE":"Adobe", "CRM":"Salesforce",
    "DDOG":"Datadog", "INTU":"Intuit", "NOW":"ServiceNow", "ADSK":"Autodesk",
    "CDNS":"Cadence", "SNPS":"Synopsys", "LMT":"Lockheed Martin", "NOC":"Northrop Grumman",
    "GD":"General Dynamics", "LHX":"L3Harris",
}
# Restrict both direction and horizon to the same clause as the named company.
WINDOW = re.compile(
    r"(?:(?:향후|앞으로|다음)\s*(?P<future>\d{1,2}|한|두)\s*(?P<fu>주|일)(?:\s*(?:이내|안에|내|동안|간))?"
    r"|(?P<within>\d{1,2}|한|두)\s*(?P<wu>주|일)\s*(?:이내|안에|내)"
    r"|(?:within(?:\s+the\s+next)?|over\s+the\s+next|in\s+the\s+next|next)\s+"
    r"(?P<en>\d{1,2}|one|two|seven|ten|fourteen|a)\s+(?P<eu>days?|weeks?)\b)", re.I)
UP = re.compile(r"(?:주가(?:가|는|의)?\s*)?(?:[\d.]+%\s*)?(?:상승|반등)(?:을|할|이|세가)?\s*(?:것으로\s*)?(?:전망|예상|기대)"
                r"|(?:shares?|stock)\s+(?:(?:are|is)\s+)?(?:expected\s+to|forecast\s+to|will|could|likely\s+to|set\s+to|to)\s+(?:rise|rally|gain|rebound)\b", re.I)
EXCLUDE = re.compile(r"아니|않|없[다을는어]|어렵|불투명|의문|불가능|철회|부인|하락|이었|했었|했지만|빗나|지난|"
                     r"\b(?:not|unlikely|denied|fell|previously|last|failed|withdrawn|if|unless)\b|[?？]", re.I)
NUMBERS = {"한":1,"두":2,"one":1,"two":2,"seven":7,"ten":10,"fourteen":14,"a":1}


def news_outlook(stock, now):
    symbol = stock["symbol"]
    aliases = {stock["name"], ENGLISH_NAMES.get(symbol, stock["name"])}
    # Short English words such as NOW can be ordinary prose. Require a cashtag for those.
    if "." not in symbol:
        aliases.add("$"+symbol)
    company = re.compile(r"(?<![A-Za-z0-9가-힣])(?:"+
                         "|".join(re.escape(a) for a in aliases)+r")(?![A-Za-z0-9])", re.I)
    for article in sorted(stock.get("news", []), key=lambda a:datetime.fromisoformat(a["date"]), reverse=True):
        published = datetime.fromisoformat(article["date"])
        if not now-timedelta(days=7) <= published <= now or not article["url"].startswith("https://"):
            continue
        fields = ("title", "originalSummary") if article.get("originalSummary") else ("title", "summary")
        for field in fields:
            for clause in re.split(r"(?<=[.!?。])\s+|[;\n]", article.get(field, "")):
                horizon = WINDOW.search(clause)
                if not horizon or EXCLUDE.search(clause):
                    continue
                statement = clause[:horizon.start()] + " " + clause[horizon.end():]
                name, direction = company.search(statement), UP.search(statement)
                if not (name and direction):
                    continue
                if horizon.start() > direction.end() and not re.fullmatch(
                    r"\s*(?:(?:by\s+)?\d+(?:\.\d+)?\s*%)?[\s,]*",
                    statement[direction.end():horizon.start()], re.I):
                    continue
                if horizon.start() < name.start() and statement[horizon.start():name.start()].strip(" ,:"):
                    continue
                # The named stock must directly qualify the share-price phrase, optionally
                # separated by the forecast horizon or possessive grammar.
                bridge = statement[name.end():direction.start()]
                if name.end()>direction.start() or not re.fullmatch(r"[\s,'’‘“”:·\-]*(?:(?:의|은|는|이|가|s)\s*)?[\s,'’‘“”:·\-]*",bridge,re.I):
                    continue
                token = (horizon["future"] or horizon["within"] or horizon["en"]).lower()
                unit = horizon["fu"] or horizon["wu"] or horizon["eu"]
                days = int(token) if token.isdecimal() else NUMBERS[token]
                if unit == "주" or unit.lower().startswith("week"):
                    days *= 7
                expires = published + timedelta(days=days)
                if 1 <= days <= 14 and now < expires:
                    return dict(evidence=clause.strip(), source=article["source"], url=article["url"],
                                publishedAt=article["date"], expiresAt=expires.isoformat(), days=days)
    return None
