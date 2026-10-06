"""Temporary: print how watvmedia.org exposes its media list, to build the daily updater."""
import re
import urllib.request

UA = {"User-Agent": "Mozilla/5.0 (compatible; SermonFinderBot/1.0)"}


def get(url):
    try:
        req = urllib.request.Request(url, headers=UA)
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, r.headers.get("content-type", ""), r.read().decode("utf-8", "replace")
    except Exception as e:  # noqa: BLE001
        return "ERR", "", str(e)


def show(url, limit=3000, grep=None):
    status, ctype, body = get(url)
    print(f"\n===== {url} -> {status} {ctype} len={len(body)}")
    if grep:
        for m in re.finditer(grep, body):
            s = max(0, m.start() - 200)
            print("…", body[s:m.end() + 400].replace("\n", " "), "…")
            print("-----")
    else:
        print(body[:limit])
    return body


show("https://watvmedia.org/robots.txt")
show("https://watvmedia.org/sitemap.xml", 4000)
page = show("https://watvmedia.org/es/media/be-born-again", 200)
for pat in [r"<meta[^>]+>", r"application/ld\+json[^<]*<", r"youtu[^\"' ]{0,60}", r"__NEXT_DATA__|__NUXT__|window\.__[A-Z_]+"]:
    found = re.findall(pat, page)[:25]
    print(f"\n--- pattern {pat}: {len(found)}")
    for f in found:
        print("  ", f[:400])
print("\n--- page head 6000 chars after <body")
i = page.find("<body")
print(page[i:i + 6000])
for u in ["https://watvmedia.org/es/media", "https://watvmedia.org/es/sermon", "https://watvmedia.org/es/media/sermon",
          "https://watvmedia.org/en/media", "https://watvmedia.org/es", "https://watvmedia.org/wp-json/wp/v2/types"]:
    b = show(u, 300)
    links = sorted(set(re.findall(r'href="([^"]*/media/[^"]*)"', b)))
    print("media links:", len(links), links[:40])
    apis = sorted(set(re.findall(r'["\'](/[^"\']*(?:api|json|ajax)[^"\']*)["\']', b)))
    print("api-ish:", apis[:40])
