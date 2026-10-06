"""Temporary: print how watvmedia.org exposes its media list, to build the daily updater."""
import re
import urllib.parse
import urllib.request

UA = {"User-Agent": "Mozilla/5.0 (compatible; SermonFinderBot/1.0)"}


def get(url, data=None, ajax=False):
    try:
        body = urllib.parse.urlencode(data).encode() if data is not None else None
        h = dict(UA)
        if ajax:
            h["X-Requested-With"] = "XMLHttpRequest"
        req = urllib.request.Request(url, data=body, headers=h)
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, r.read().decode("utf-8", "replace")
    except Exception as e:  # noqa: BLE001
        return "ERR", str(e)


def one(s, n=700):
    return re.sub(r"\s+", " ", s)[:n]


def strip(html):
    html = re.sub(r"<script.*?</script>", "", html, flags=re.S)
    return re.sub(r"<!--.*?-->", "", html, flags=re.S)


s, sm = get("https://watvmedia.org/common/sitemap.xml")
locs = re.findall(r"<loc>([^<]+)</loc>", sm)
print("## sitemap", s, len(sm), "locs:", len(locs))
print("   first:", locs[:8])
print("   es media:", len([u for u in locs if "/es/media/" in u]), "en media:", len([u for u in locs if "/en/media/" in u]))
print("   sample entry:", one(sm[sm.find("<url>"):sm.find("<url>") + 600], 600))

for method, data in [("GET", None), ("POST", {"WATV_MEDIA_GB": 1, "CATEGORY1_CD": ""})]:
    url = "https://watvmedia.org/es/media/list" + ("?WATV_MEDIA_GB=1&CATEGORY1_CD=" if method == "GET" else "")
    s, b = get(url, data)
    links = re.findall(r'href="(/es/media/[^"]+)"', b)
    print(f"## list {method}", s, len(b), "links:", len(links), links[:12])
    i = b.find(links[0]) if links else -1
    if i > 0:
        print("   item html:", one(strip(b[i - 600:i + 1600]), 2200))
    print("   paging/ajax:", sorted(set(re.findall(r"[\"']/?([\w/]+\.ajax)", b))))
    for m in list(re.finditer(r"function (\w*(?:[Pp]age|[Mm]ore|[Ll]ist)\w*)\s*\(", b))[:8]:
        print("   fn:", one(b[m.start():m.start() + 700], 700))

_, page = get("https://watvmedia.org/es/media/be-born-again")
body = strip(page)
i = body.find('class="you')
print("## media page after languages:")
print(one(body[i:], 4500))
_, en = get("https://watvmedia.org/en/media/be-born-again")
i = strip(en).find('class="you')
print("## EN page after languages:")
print(one(strip(en)[i:], 2500))
