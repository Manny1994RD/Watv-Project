"""Temporary: print how watvmedia.org exposes its media list, to build the daily updater."""
import re
import urllib.parse
import urllib.request

UA = {"User-Agent": "Mozilla/5.0 (compatible; SermonFinderBot/1.0)", "X-Requested-With": "XMLHttpRequest"}


def get(url, data=None):
    try:
        body = urllib.parse.urlencode(data).encode() if data else None
        req = urllib.request.Request(url, data=body, headers=UA)
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, r.read().decode("utf-8", "replace")
    except Exception as e:  # noqa: BLE001
        return "ERR", str(e)


def one(s, n=700):
    return re.sub(r"\s+", " ", s)[:n]


def ctx(body, pat, before=150, after=600, maxn=4):
    for m in list(re.finditer(pat, body))[:maxn]:
        print("   >>", one(body[max(0, m.start() - before):m.end() + after], before + after + 50))


print("## robots:", one(get("https://watvmedia.org/robots.txt")[1], 600))
print("## sitemap:", one(get("https://watvmedia.org/sitemap.xml")[1], 600))

_, home = get("https://watvmedia.org/es")
print("## home: goMediaList/newMedia/ajax contexts")
ctx(home, r"function goMediaList", 0, 900, 2)
ctx(home, r"newMedia\.ajax", 300, 700, 2)

for js in ["/common/common.js", "/scripts/media.js", "/common/media.js"]:
    s, b = get("https://watvmedia.org" + js)
    print("## js", js, s, len(b))
    if s == 200:
        ctx(b, r"goMediaList", 0, 700, 3)
        print("   ajax endpoints:", sorted(set(re.findall(r"[\"']/?([\w/]+\.ajax)", b)))[:40])

_, page = get("https://watvmedia.org/es/media/be-born-again")
i = page.find('class="container-body')
body = re.sub(r"<script.*?</script>", "", page[i:], flags=re.S)
body = re.sub(r"<!--.*?-->", "", body, flags=re.S)
print("## media page body (scripts removed):")
print(one(body, 5000))
print("## media page ajax:", sorted(set(re.findall(r"[\"']/?([\w/]+\.ajax)", page))))
ctx(page, r"\.ajax", 200, 500, 8)
