"""Fetch publisher feeds and Naver News articles, then summarize their reported text."""
import logging
import re
from collections import Counter
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from bs4 import BeautifulSoup
import feedparser
import requests

US_FEEDS = {
    "MarketWatch": "https://feeds.content.dowjones.io/public/rss/mw_topstories",
    "The Wall Street Journal": "https://feeds.content.dowjones.io/public/rss/RSSMarketsMain",
}
NAVER_SECTION = "https://news.naver.com/section/101"
AGENT = {"User-Agent": "Mozilla/5.0"}


def fetch(url, **kwargs):
    response = requests.get(url, headers=AGENT, timeout=12, **kwargs)
    response.raise_for_status()
    return response


def summarize(text):
    sentences = re.split(r"(?<=[.!?。])\s+", " ".join(text.split()))
    sentences = [s for s in sentences if len(s) >= 16]
    if not sentences:
        return text.strip()[:300]
    words = [set(re.findall(r"[\w가-힣]{3,}", s.lower())) for s in sentences]
    frequencies = Counter(w for group in words for w in group)
    def weight(i):
        return sum(frequencies[w] for w in words[i]) / max(len(words[i]), 1) + (1 if i == 0 else 0)
    selected = sorted(sorted(range(len(words)), key=weight, reverse=True)[:2])
    return " ".join(sentences[i] for i in selected)[:600]


def translate_summary(summary):
    try:
        translated = fetch("https://translate.googleapis.com/translate_a/single", params={
            "client":"gtx", "sl":"en", "tl":"ko", "dt":"t", "q":summary}).json()
        korean = "".join(part[0] for part in translated[0] if part[0])
        if re.search("[가-힣]", korean):
            return korean, "ko"
    except (ValueError, TypeError, KeyError, IndexError, requests.RequestException):
        logging.warning("번역을 사용할 수 없어 영어 요약 표시")
    return summary, "en"


def us_news(now):
    articles = []
    for source, url in US_FEEDS.items():
        try:
            entries = feedparser.parse(fetch(url).content).entries
        except requests.RequestException:
            logging.exception("미국 뉴스 피드 실패 %s", source)
            continue
        for e in entries:
            if not e.get("published_parsed") or not e.get("link", "").startswith("https://"):
                continue
            stamp = datetime(*e.published_parsed[:6], tzinfo=timezone.utc)
            if not now-timedelta(hours=24) <= stamp <= now:
                continue
            body = BeautifulSoup(e.get("summary", ""), "html.parser").get_text(" ", strip=True)
            if not body or body.strip() == e.title.strip():
                continue
            summary, language = translate_summary(summarize(body))
            articles.append(dict(source=source, region="미국", title=e.title, url=e.link, date=stamp.isoformat(),
                                 summary=summary, language=language))
            if sum(a["source"] == source for a in articles) >= 4:
                break
    return articles


def naver_news(now):
    section = BeautifulSoup(fetch(NAVER_SECTION).content, "html.parser")
    links = dict.fromkeys(a["href"].split("?")[0] for a in section.select("a[href]")
                          if re.match(r"https://n\.news\.naver\.com/mnews/article/\d+/\d+", a["href"]))
    articles = []
    for link in list(links)[:32]:
        try:
            doc = BeautifulSoup(fetch(link).content, "html.parser")
            stamp_tag = doc.select_one("._ARTICLE_DATE_TIME[data-date-time]")
            title = doc.select_one('meta[property="og:title"]')
            body = doc.select_one("#dic_area")
            if not (stamp_tag and title and body):
                continue
            stamp = datetime.fromisoformat(stamp_tag["data-date-time"]).replace(tzinfo=ZoneInfo("Asia/Seoul"))
            if not now-timedelta(hours=24) <= stamp <= now:
                continue
            for node in body.select("script, style, figure, .end_photo_org, .img_desc"):
                node.decompose()
            summary = summarize(body.get_text(" ", strip=True)[:4500])
            if summary:
                publisher = doc.select_one('meta[property="og:article:author"]')
                source = publisher["content"].split("|")[0].strip() if publisher else "네이버뉴스"
                articles.append(dict(source=source, region="네이버뉴스", title=title["content"], url=link,
                                     date=stamp.isoformat(), summary=summary, language="ko"))
        except (ValueError, KeyError, requests.RequestException):
            logging.warning("네이버 뉴스 기사 조회 실패 %s", link)
        if len(articles) >= 8:
            break
    return articles


def collect_news(now):
    articles = {}
    for read in (us_news, naver_news):
        try:
            for item in read(now):
                articles[item["url"]] = item
        except requests.RequestException:
            logging.exception("뉴스 수집 실패 %s", read.__name__)
    return sorted(articles.values(), key=lambda article: datetime.fromisoformat(article["date"]), reverse=True)


def company_news(item, now):
    host = "https://m.stock.naver.com/api" if item["exchange"] in ("KOSPI", "KOSDAQ") else "https://api.stock.naver.com"
    groups = fetch(f"{host}/news/stock/{item['code']}", params={"page":1, "pageSize":10}).json()
    articles = {}
    for group in groups:
        for article in group["items"]:
            stamp = datetime.strptime(article["datetime"][:12], "%Y%m%d%H%M").replace(tzinfo=ZoneInfo("Asia/Seoul"))
            url = article.get("mobileNewsUrl", "")
            if not url.startswith("https://") or not now-timedelta(days=7) <= stamp <= now:
                continue
            body = BeautifulSoup(article.get("body") or "", "html.parser").get_text(" ", strip=True)
            articles[url] = dict(source=article["officeName"], region="네이버증권 종목 뉴스",
                title=BeautifulSoup(article["title"], "html.parser").get_text(), date=stamp.isoformat(),
                url=url, summary=summarize(body), language="ko")
    if item["exchange"] in ("NASDAQ", "NYSE"):
        params = {"s":item["symbol"], "region":"US", "lang":"en-US"}
        try:
            feed = feedparser.parse(fetch("https://feeds.finance.yahoo.com/rss/2.0/headline", params=params).content)
            for entry in feed.entries[:8]:
                if not entry.get("published_parsed") or not entry.get("link", "").startswith("https://"):
                    continue
                stamp = datetime(*entry.published_parsed[:6], tzinfo=timezone.utc)
                if not now-timedelta(days=7) <= stamp <= now:
                    continue
                body = BeautifulSoup(entry.get("summary", ""), "html.parser").get_text(" ", strip=True)
                summary, language = translate_summary(summarize(body)) if body else ("", "en")
                articles[entry.link] = dict(source=entry.get("source", {}).get("title") or "Yahoo Finance 종목 피드",
                    region="미국", title=entry.title, date=stamp.isoformat(), url=entry.link,
                    summary=summary, language=language)
                if sum(a["region"] == "미국" for a in articles.values()) >= 2:
                    break
        except requests.RequestException:
            logging.warning("미국 종목 피드 조회 실패 %s", item["symbol"])
    return sorted(articles.values(), key=lambda a:datetime.fromisoformat(a["date"]), reverse=True)[:3]

