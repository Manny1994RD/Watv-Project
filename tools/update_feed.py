#!/usr/bin/env python3
"""Daily updater: find sermons newly published on watvmedia.org and add them to the site.

Runs every day on GitHub Actions (.github/workflows/update-sermons.yml). It:
  1. reads the newest sermons and summary sermons from watvmedia.org (Spanish and English),
  2. skips any already in the library (the Excel or a previous run),
  3. reads each new sermon's page (title, full summary, date, length, views, YouTube link, category),
  4. detects its topics from the title and summary,
  5. saves them in data/auto_sermons.json and rebuilds data/sermons.js.

Only the Python standard library is needed for the scraping; rebuilding needs openpyxl.
"""
import json
import re
import subprocess
import sys
import time
import unicodedata
import urllib.parse
import urllib.request
from datetime import date
from html import unescape
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
AUTO = ROOT / "data" / "auto_sermons.json"
SITE_JS = ROOT / "data" / "sermons.js"
BASE = "https://watvmedia.org"
UA = {"User-Agent": "Mozilla/5.0 (compatible; SermonFinderBot/1.0; +https://github.com/Manny1994RD/Watv-Project)"}
MAX_NEW_PER_RUN = 80

LANGS = ["es", "en"]
TYPES = {1: "s", 6: "r"}                      # WATV_MEDIA_GB -> our type (sermon, summary sermon)
CATEGORY_CODES = {5: "parents", 7: "truth", 6: "covenant", 8: "faith", 9: "character"}

# Word stems (accents removed, lowercase) that signal each topic. A word counts if it starts with a stem.
TOPIC_STEMS = {
    "anger": "anger angry temper wrath rage ira enoj coraje furi",
    "anxiety": "anxi worr ansie preocup inquiet",
    "baptism": "baptis bautis bautiz",
    "family": "child famil parent son daughter marri husband wife hijo hija famili padres matrimon esposo esposa",
    "creation": "creation creator creat scien design creacion creador cienci",
    "envy": "envy envi jealous celos",
    "evangelism": "preach gospel evangel mission predic evangel mision",
    "faith": "faith trust believ doubt fe confia creer creyent duda",
    "fasting": "fast ayun",
    "fear": "fear temor",
    "feasts": "feast tabernacl trumpet atonement pentecost unleavened fiesta tabernacul trompeta expiacion pentecost",
    "forgiveness": "forgiv reconcil perdon reconcil",
    "gratitude": "thank grateful gratitud agradec gracias",
    "greed": "greed materiali wealth rich avaric codicia riqueza",
    "heaven": "heaven hell soul cielo infierno alma",
    "father": "ahnsahnghong",
    "mother": "mother madre jerusalen jerusalem",
    "zion": "zion sion",
    "spirit": "spirit bride espiritu esposa",
    "parents": "honor honra",
    "hope": "hope comfort despair esperanz consuel desesper",
    "humility": "humil pride proud arrogan humild orgull soberbi",
    "joy": "joy happi rejoic alegr felic gozo",
    "judgment": "judgment judgement juicio",
    "lies": "lie lies lying deceit decei mentir mentira engan",
    "love": "love loving brother sister amor amar hermano hermana",
    "money": "money work job provision dinero trabajo provision",
    "obedience": "obey obedien disobe obedec obedien desobed",
    "passover": "passover pascua",
    "patience": "patien self-control paciencia dominio",
    "persecution": "persecut mock persecu burla",
    "prayer": "pray oracion orar",
    "prophecy": "prophe profec profet",
    "repentance": "repent arrepent",
    "resurrection": "resurrect transform resurrec transform",
    "salvation": "salvation salvacion eternal etern",
    "service": "serv sacrific servi sacrifici",
    "sickness": "sick heal disease enferm sana salud",
    "bible": "bible scriptur biblia escritur",
    "supper": "supper communion cena comunion",
    "sabbath": "sabbath saturday sabado reposo",
    "covenant": "covenant pacto",
    "tithe": "tithe offering diezmo ofrenda",
    "trials": "trial suffer hardship tribulation overcom prueba sufrim tribulac superar",
    "unity": "unity harmony united unidad armonia unid",
    "words": "tongue speech speak gossip complain lengua hablar chisme queja murmur",  # not "word": too often "word of God"
    "worship": "worship adoracion culto",
}

EN_MONTHS = {m: i + 1 for i, m in enumerate(
    ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"])}
ES_MONTHS = {m: i + 1 for i, m in enumerate(
    ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"])}


def fetch(url, tries=3):
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=40) as r:
                return r.read().decode("utf-8", "replace")
        except Exception as e:  # noqa: BLE001
            if i == tries - 1:
                print(f"  ! could not fetch {url}: {e}")
                return ""
            time.sleep(3 * (i + 1))
    return ""


def text(html):
    html = re.sub(r"<br\s*/?>|</p>|</div>", " ", html)
    return re.sub(r"\s+", " ", unescape(re.sub(r"<[^>]+>", "", html))).strip()


def norm(s):
    s = unicodedata.normalize("NFD", s.lower())
    return "".join(c for c in s if unicodedata.category(c) != "Mn")


def list_page(lang, gb, cat=""):
    """Return [(slug, title, duration)] from a watvmedia list page (newest first)."""
    q = urllib.parse.urlencode({"WATV_MEDIA_GB": gb, "CATEGORY1_CD": cat})
    html = fetch(f"{BASE}/{lang}/media/list?{q}")
    out, seen = [], set()
    for block in html.split('<span class="video-list">')[1:]:
        m = re.search(rf'href="/{lang}/media/([^"]+)"', block)
        if not m or m.group(1) in seen:
            continue
        seen.add(m.group(1))
        dur = re.search(r'class="time[^"]*">(?:<span[^>]*>.*?</span>)?\s*([\d:]+)', block, re.S)
        title = re.search(r"<h3>(.*?)</h3>", block, re.S)
        out.append((m.group(1), text(re.sub(r'<span class="new2">.*?</span>', "", title.group(1))) if title else "",
                    dur.group(1) if dur else ""))
    return out


def parse_duration(s):
    secs = 0
    for p in (s or "").split(":"):
        if p.isdigit():
            secs = secs * 60 + int(p)
    return secs


def parse_date(s, lang):
    s = norm(s or "")
    if lang == "es":
        m = re.search(r"(\d{1,2})\s+([a-z]{3})[a-z]*\.?\s+(\d{4})", s)
        if m and m.group(2) in ES_MONTHS:
            return f"{m.group(3)}-{ES_MONTHS[m.group(2)]:02d}-{int(m.group(1)):02d}"
    m = re.search(r"([a-z]{3})[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})", s)
    if m and m.group(1) in EN_MONTHS:
        return f"{m.group(3)}-{EN_MONTHS[m.group(1)]:02d}-{int(m.group(2)):02d}"
    return ""


def media_page(lang, slug):
    html = fetch(f"{BASE}/{lang}/media/{slug}")
    if not html:
        return None
    title = re.search(r'<h1 class="hd-page">(.*?)</h1>', html, re.S)
    og_title = re.search(r'<meta property="og:title" content="([^"]*)"', html)
    body = re.search(r'<div class="col page-body">(.*?)</div>\s*</div>', html, re.S)
    desc = re.search(r'<meta property="og:description" content="([^"]*)"', html)
    when = re.search(r'class="content-info.*?<dd>(.*?)</dd>', html, re.S)
    views = re.search(r'class="state-view"[^>]*>.*?<em>([\d.,\s]+)</em>', html, re.S)
    yt = re.search(r"youtube\.com/(?:watch\?v=|embed/)([\w-]{11})", html)
    return {
        "t": text(title.group(1)) if title else unescape(og_title.group(1)) if og_title else "",
        "s": text(body.group(1)) if body else unescape(desc.group(1)) if desc else "",
        "dt": parse_date(text(when.group(1)) if when else "", lang),
        "v": int(re.sub(r"\D", "", views.group(1)) or 0) if views else 0,
        "y": yt.group(1) if yt else "",
    }


def detect_topics(*texts):
    words = re.findall(r"[a-zñ]+", norm(" ".join(texts)))
    counts = {}
    for topic, stems in TOPIC_STEMS.items():
        n = 0
        for stem in stems.split():
            if len(stem) <= 3:  # very short stems ("fe", "ira") must match the whole word
                n += sum(1 for w in words if w == stem)
            else:
                n += sum(1 for w in words if w.startswith(stem))
        if n:
            counts[topic] = n
    return sorted(([k, n] for k, n in counts.items()), key=lambda x: -x[1])[:8]


def known_urls():
    urls = set()
    if SITE_JS.exists():
        urls.update(re.findall(r'"u":"([^"]+)"', SITE_JS.read_text(encoding="utf-8")))
    return urls


def check(n):
    """Test mode: read the n newest sermons of each list and print what would be saved, changing nothing."""
    ok = True
    for lang in LANGS:
        for gb, kind in TYPES.items():
            items = list_page(lang, gb)
            print(f"{lang} {kind}: {len(items)} on the newest list")
            ok &= bool(items)
            for slug, list_title, dur in items[:n]:
                page = media_page(lang, slug) or {}
                tp = detect_topics(page.get("t", ""), page.get("s", ""))
                print(f"  {slug}\n    title={page.get('t')!r} dur={dur} date={page.get('dt')} views={page.get('v')} "
                      f"yt={page.get('y')}\n    topics={tp}\n    summary={page.get('s', '')[:160]!r}")
                ok &= bool(page.get("t") and page.get("dt") and page.get("y"))
    print("CHECK OK" if ok else "CHECK FOUND MISSING FIELDS")
    return 0 if ok else 1


def main():
    if len(sys.argv) > 2 and sys.argv[1] == "--check":
        return check(int(sys.argv[2]))
    auto = json.loads(AUTO.read_text(encoding="utf-8")) if AUTO.exists() else []
    known = known_urls() | {a["u"] for a in auto}
    added = []

    for lang in LANGS:
        for gb, kind in TYPES.items():
            items = list_page(lang, gb)
            print(f"{lang} {kind}: {len(items)} on the newest list")
            new = [(slug, t, d) for slug, t, d in items if f"{BASE}/{lang}/media/{slug}" not in known]
            if not new:
                continue
            # Which categories each new item belongs to (from the category-filtered lists).
            cats = {}
            for code, key in CATEGORY_CODES.items():
                for slug, _, _ in list_page(lang, gb, code):
                    cats.setdefault(slug, []).append(key)
            for slug, list_title, dur in new:
                if len(added) >= MAX_NEW_PER_RUN:
                    break
                page = media_page(lang, slug)
                if not page or not (page["t"] or list_title):
                    continue
                url = f"{BASE}/{lang}/media/{slug}"
                item = {
                    "id": 100000 + len(auto) + len(added) + 1,
                    "l": lang, "k": kind,
                    "t": page["t"] or list_title,
                    "c": cats.get(slug, []),
                    "tp": detect_topics(page["t"] or list_title, page["s"]),
                    "d": parse_duration(dur), "dt": page["dt"] or date.today().isoformat(),
                    "v": page["v"], "s": page["s"], "u": url, "y": page["y"],
                    "added": date.today().isoformat(),
                }
                added.append(item)
                known.add(url)
                print(f"  + {lang} {kind} {item['t']}  ({len(item['tp'])} topics)")
                time.sleep(0.5)  # be gentle with watvmedia.org

    if not added:
        print("No new sermons today.")
        return 0
    AUTO.write_text(json.dumps(auto + added, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"Added {len(added)} new sermons; rebuilding data/sermons.js")
    return subprocess.call([sys.executable, str(ROOT / "tools" / "build_data.py")])


if __name__ == "__main__":
    sys.exit(main())
