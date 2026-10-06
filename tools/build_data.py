#!/usr/bin/env python3
"""Convert the sermon Excel library into data/sermons.js for the website.

Usage:
    pip install openpyxl
    python3 tools/build_data.py [path/to/Biblioteca_Sermones_WATV.xlsx]

Re-run this whenever the Excel file is updated, then publish the site again.
"""
import json
import re
import sys
from collections import Counter
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_XLSX = ROOT / "data" / "Biblioteca_Sermones_WATV.xlsx"
OUT = ROOT / "data" / "sermons.js"
AUTO = ROOT / "data" / "auto_sermons.json"  # sermons found by tools/update_feed.py

# Canonical topics: key -> (English label in the Excel, Spanish label in the Excel, emoji)
TOPICS = {
    "anger":        ("Anger and temper", "Ira y enojo (control del temperamento)", "😤"),
    "anxiety":      ("Anxiety and worry", "Ansiedad y preocupación", "😟"),
    "baptism":      ("Baptism", "Bautismo", "💧"),
    "family":       ("Children and family", "Educación de los hijos y familia", "👨‍👩‍👧"),
    "creation":     ("Creation and God's design", "La creación y el diseño de Dios", "🌍"),
    "envy":         ("Envy and jealousy", "Envidia y celos", "🫥"),
    "evangelism":   ("Evangelism and preaching", "Evangelización y predicación", "📣"),
    "faith":        ("Faith and trust in God", "Fe y confianza en Dios", "🕊️"),
    "fasting":      ("Fasting", "Ayuno", "🍃"),
    "fear":         ("Fear of God", "Temor de Dios", "🙇"),
    "feasts":       ("Feasts of God", "Fiestas solemnes de Dios", "🎺"),
    "forgiveness":  ("Forgiveness and reconciliation", "Perdón y reconciliación", "🤝"),
    "gratitude":    ("Gratitude and thanksgiving", "Gratitud y acción de gracias", "🙏"),
    "greed":        ("Greed and materialism", "Avaricia y materialismo", "💸"),
    "heaven":       ("Heaven, hell and the soul", "Cielo, infierno y alma", "☁️"),
    "father":       ("Heavenly Father (Christ Ahnsahnghong)", "Padre celestial (Cristo Ahnsahnghong)", "👑"),
    "mother":       ("Heavenly Mother", "Amor y palabra de Dios Madre", "💗"),
    "zion":         ("Heavenly family and Zion", "Familia celestial y Sion", "🏠"),
    "spirit":       ("Holy Spirit and the Bride", "Espíritu Santo y la Esposa", "🔥"),
    "parents":      ("Honoring parents", "Honrar a los padres", "🧓"),
    "hope":         ("Hope and comfort", "Esperanza y consuelo", "🌅"),
    "humility":     ("Humility and pride", "Humildad y orgullo", "🌾"),
    "joy":          ("Joy and happiness", "Alegría y felicidad", "😊"),
    "judgment":     ("Judgment and second coming", "Juicio y segunda venida", "⚖️"),
    "lies":         ("Lies and deceit", "Mentira y engaño", "🎭"),
    "love":         ("Love and brotherly love", "Amor y amor fraternal", "❤️"),
    "money":        ("Money, work and provision", "Dinero, trabajo y provisión", "💼"),
    "obedience":    ("Obedience", "Obediencia", "✅"),
    "passover":     ("Passover", "Pascua", "🍷"),
    "patience":     ("Patience and self-control", "Paciencia y dominio propio", "⏳"),
    "persecution":  ("Persecution and mockery", "Persecución y burla", "🛡️"),
    "prayer":       ("Prayer", "Oración", "🙏"),
    "prophecy":     ("Prophecy and Christ Ahnsahnghong", "Cristo Ahnsahnghong y las profecías", "📜"),
    "repentance":   ("Repentance", "Arrepentimiento", "🔁"),
    "resurrection": ("Resurrection and transformation", "Resurrección y transformación", "🦋"),
    "salvation":    ("Salvation and eternal life", "Salvación y vida eterna", "✨"),
    "service":      ("Service and sacrifice", "Servicio y sacrificio", "🫶"),
    "sickness":     ("Sickness and healing", "Enfermedad y sanidad", "🩺"),
    "bible":        ("The Bible and its authority", "La Biblia y su autoridad", "📖"),
    "supper":       ("The Lord's Supper", "Cena del Señor / Santa Cena", "🍞"),
    "sabbath":      ("The Sabbath", "Día de Reposo (sábado)", "🕯️"),
    "covenant":     ("The new covenant", "El nuevo pacto", "📜"),
    "tithe":        ("Tithe and offering", "Diezmo y ofrenda", "🎁"),
    "trials":       ("Trials and suffering", "Pruebas y tribulación", "⛰️"),
    "unity":        ("Unity and harmony", "Unidad y armonía", "🔗"),
    "words":        ("Words and the tongue", "Palabras y lengua (hablar bien)", "🗣️"),
    "worship":      ("Worship and service attendance", "Asistencia al culto y adoración", "⛪"),
}

CATEGORIES = {
    "faith":     ("Faith", "Fe"),
    "covenant":  ("New Covenant & Feast", "El nuevo pacto y las fiestas"),
    "truth":     ("Truth", "Verdad"),
    "parents":   ("Father/Mother", "Padre/Madre"),
    "character": ("Character", "Carácter"),
    "monthly":   ("Monthly Sermon Series", "Palabras de este mes"),
    "testimony": ("Testimony", "Testimonio"),
}

TYPES = {"Sermón": "s", "Resumen": "r", "Mensual": "m"}

ES_MONTHS = {m: i + 1 for i, m in enumerate(
    ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"])}

TOPIC_BY_LABEL = {}
for key, (en, es, _) in TOPICS.items():
    TOPIC_BY_LABEL[en.lower()] = key
    TOPIC_BY_LABEL[es.lower()] = key
CAT_BY_LABEL = {}
for key, (en, es) in CATEGORIES.items():
    CAT_BY_LABEL[en.lower()] = key
    CAT_BY_LABEL[es.lower()] = key

TOPIC_RE = re.compile(r"^(.*?)\s*\((\d+)\)")


def parse_topics(cell, unknown):
    out = []
    for part in (cell or "").split(";"):
        part = part.strip()
        if not part:
            continue
        m = TOPIC_RE.match(part)
        label, n = (m.group(1), int(m.group(2))) if m else (part, 1)
        key = TOPIC_BY_LABEL.get(label.strip().lower())
        if not key:
            unknown[label] += 1
            continue
        out.append([key, n])
    return out


def parse_duration(s):
    if not s:
        return 0
    secs = 0
    for p in str(s).strip().split(":"):
        secs = secs * 60 + int(p or 0)
    return secs


def parse_date(s):
    if not s:
        return ""
    m = re.match(r"(\d{1,2})\s+(\w{3})\w*\s+(\d{4})", str(s).strip().lower())
    if not m or m.group(2) not in ES_MONTHS:
        return ""
    return f"{m.group(3)}-{ES_MONTHS[m.group(2)]:02d}-{int(m.group(1)):02d}"


def parse_views(s):
    if s is None:
        return 0
    digits = re.sub(r"\D", "", str(s))
    return int(digits) if digits else 0


def youtube_id(url):
    m = re.search(r"(?:youtu\.be/|v=|embed/)([\w-]{11})", url or "")
    return m.group(1) if m else ""


def clean_title(t):
    t = (t or "").strip()
    return re.sub(r"^NEW(?=[A-ZÁÉÍÓÚÑ¿¡“\"'])", "", t).strip()


def clean_summary(s):
    s = (s or "").strip()
    # The site's summaries sometimes lose the space after a sentence: "cuerpo.Dios" -> "cuerpo. Dios"
    s = re.sub(r"([.!?;:,”])(?=[A-ZÁÉÍÓÚÑ¿¡“])", r"\1 ", s)
    # ...and sometimes a heading is glued to the first sentence: "Words of HopeGod delivered" -> "Hope God"
    s = re.sub(r"([a-záéíóúñ])([A-ZÁÉÍÓÚÑ][a-záéíóúñ])", r"\1 \2", s)
    s = re.sub(r"\s+", " ", s)
    return s


def split_list(cell, sep=","):
    return [x.strip() for x in (cell or "").split(sep) if x.strip()]


def slug_of(url):
    m = re.search(r"/media/([^/?#]+)", url or "")
    return m.group(1) if m else ""


def main():
    xlsx = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_XLSX
    wb = openpyxl.load_workbook(xlsx, read_only=True)
    ws = wb["Catálogo · Catalog"]
    unknown_topics, unknown_cats = Counter(), Counter()
    items = []
    for row in ws.iter_rows(min_row=2, values_only=True):
        (_, num, lang, kind, title, _section, category, _channel, topics, tags,
         words, duration, date, views, summary, link, yt) = row[:17]
        if not title:
            continue
        cats = []
        for c in split_list(category):
            key = CAT_BY_LABEL.get(c.lower())
            if key:
                cats.append(key)
            else:
                unknown_cats[c] += 1
        items.append({
            "id": int(num),
            "l": (lang or "").lower(),
            "k": TYPES.get(kind, "s"),
            "t": clean_title(title),
            "c": cats,
            "tp": parse_topics(topics, unknown_topics),
            "tg": split_list(tags),
            "w": split_list(words),
            "d": parse_duration(duration),
            "dt": parse_date(date),
            "v": parse_views(views),
            "s": clean_summary(summary),
            "u": link or "",
            "y": youtube_id(yt),
        })

    # Add sermons the daily updater found that the Excel doesn't have yet.
    if AUTO.exists():
        in_excel = {it["u"] for it in items}
        auto = [a for a in json.loads(AUTO.read_text(encoding="utf-8")) if a["u"] not in in_excel]
        for a in auto:
            a.pop("added", None)
        items.extend(auto)
        print(f"  + {len(auto)} sermons from the daily updater")

    # Pair Spanish/English versions of the same video (same watvmedia slug).
    by_slug = {}
    for it in items:
        by_slug.setdefault(slug_of(it["u"]), []).append(it)
    for group in by_slug.values():
        langs = {it["l"]: it for it in group}
        if "es" in langs and "en" in langs:
            es, en = langs["es"], langs["en"]
            es["alt"], en["alt"] = en["id"], es["id"]
            # The English rows have no date: borrow it from the Spanish twin.
            if not en["dt"]:
                en["dt"] = es["dt"]

    # Drop empty keys to keep the file small.
    for it in items:
        for k in [k for k, v in it.items() if v in ("", [], 0) and k not in ("id",)]:
            del it[k]

    topics = {k: {"en": en, "es": es, "e": e} for k, (en, es, e) in TOPICS.items()}
    cats = {k: {"en": en, "es": es} for k, (en, es) in CATEGORIES.items()}
    payload = {"topics": topics, "categories": cats, "items": items}
    js = ("// Generated by tools/build_data.py from the sermon Excel library. Do not edit by hand.\n"
          "window.SERMON_DATA = " + json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + ";\n")
    OUT.write_text(js, encoding="utf-8")

    print(f"Wrote {len(items)} videos to {OUT.relative_to(ROOT)} ({OUT.stat().st_size / 1024:.0f} KB)")
    print(f"  with YouTube thumbnail: {sum(1 for i in items if i.get('y'))}")
    print(f"  with topic index:       {sum(1 for i in items if i.get('tp'))}")
    print(f"  ES/EN pairs:            {sum(1 for i in items if i.get('alt')) // 2}")
    if unknown_topics:
        print("  Unmapped topics (add them to TOPICS):", dict(unknown_topics))
    if unknown_cats:
        print("  Unmapped categories (add them to CATEGORIES):", dict(unknown_cats))


if __name__ == "__main__":
    main()
