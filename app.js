(() => {
  'use strict';

  const DATA = window.SERMON_DATA;
  const TOPICS = DATA.topics;
  const CATS = DATA.categories;
  const ITEMS = DATA.items;
  const BY_ID = new Map(ITEMS.map(v => [v.id, v]));
  const PAGE = 24;

  // ---------- Text ----------
  const I18N = {
    es: {
      brand1: 'Buscador', brand2: 'de Sermones',
      heroTitle: '¿Qué necesita <span class="grad">el hermano</span> hoy?',
      heroSub: 'Escribe un tema, un sentimiento o una pregunta. Buscamos en el título, el resumen, las etiquetas y en lo que se habla dentro de cada sermón.',
      placeholder: 'Ej.: controlar el enojo, preocupación, Pascua…',
      voice: 'Buscar por voz', clear: 'Borrar', close: 'Cerrar', toTop: 'Volver arriba',
      videosIn: 'Vídeos en', both: 'Ambos',
      needsTitle: 'Busca por necesidad', seeAll: 'Ver todos', seeLess: 'Ver menos',
      filters: 'Filtros', reset: 'Limpiar todo', type: 'Tipo', length: 'Duración', category: 'Categoría',
      topics: 'Temas', tags: 'Etiquetas', filterTopics: 'Filtrar temas…', sort: 'Ordenar',
      saved: 'Guardados',
      libStat: n => `${n.toLocaleString('es')} sermones · español e inglés`,
      show: n => `Ver ${n.toLocaleString('es')} resultados`,
      results: n => `<span><b>${n.toLocaleString('es')}</b> ${n === 1 ? 'sermón' : 'sermones'}</span>`,
      savedResults: n => `<span><b>${n}</b> guardados</span>`,
      types: { s: 'Sermón', r: 'Sermón resumido', m: 'Palabras de este mes' },
      lens: { short: 'Menos de 10 min', medium: '10 a 30 min', long: 'Más de 30 min' },
      sorts: { relevance: 'Más relevantes', views: 'Más vistos', newest: 'Más recientes', shortest: 'Más cortos' },
      emptyTitle: 'No encontramos sermones',
      emptyText: 'Prueba con otra palabra o quita algún filtro.',
      emptySaved: 'Aún no has guardado sermones',
      emptySavedText: 'Toca el corazón de un sermón para guardarlo aquí.',
      clearFilters: 'Quitar filtros', backAll: 'Ver todos los sermones',
      watch: 'Ver en WATV', save: 'Guardar', savedBtn: 'Guardado', share: 'Compartir',
      inEnglish: 'Ver en inglés', inSpanish: 'Ver en español', coversTitle: 'Qué temas trata', related: 'Sermones relacionados',
      copied: 'Enlace copiado', addedSaved: 'Guardado en tus sermones', removedSaved: 'Quitado de guardados',
      mentions: n => `mencionado ${n} ${n === 1 ? 'vez' : 'veces'}`,
      views: n => `${n.toLocaleString('es')} vistas`,
      min: 'min', topicMatch: 'Tema', tagMatch: 'Etiqueta', need: 'Necesidad',
      search: 'Búsqueda', partial: 'Sin coincidencia exacta. Mostrando los más cercanos.',
      noVideo: 'Este vídeo solo está disponible en WATV.',
      footer: 'Fuente: <a href="https://watvmedia.org" target="_blank" rel="noopener">watvmedia.org</a>. Los enlaces abren el vídeo original.',
    },
    en: {
      brand1: 'Sermon', brand2: 'Finder',
      heroTitle: 'What does <span class="grad">the member</span> need today?',
      heroSub: 'Type a topic, a feeling or a question. We search the title, summary, tags and what is actually said inside each sermon.',
      placeholder: 'e.g. control anger, worry, Passover…',
      voice: 'Search by voice', clear: 'Clear', close: 'Close', toTop: 'Back to top',
      videosIn: 'Videos in', both: 'Both',
      needsTitle: 'Find by need', seeAll: 'See all', seeLess: 'See less',
      filters: 'Filters', reset: 'Clear all', type: 'Type', length: 'Length', category: 'Category',
      topics: 'Topics', tags: 'Tags', filterTopics: 'Filter topics…', sort: 'Sort',
      saved: 'Saved',
      libStat: n => `${n.toLocaleString('en')} sermons · Spanish & English`,
      show: n => `Show ${n.toLocaleString('en')} results`,
      results: n => `<span><b>${n.toLocaleString('en')}</b> ${n === 1 ? 'sermon' : 'sermons'}</span>`,
      savedResults: n => `<span><b>${n}</b> saved</span>`,
      types: { s: 'Sermon', r: 'Summary sermon', m: 'Monthly sermon' },
      lens: { short: 'Under 10 min', medium: '10–30 min', long: 'Over 30 min' },
      sorts: { relevance: 'Best match', views: 'Most viewed', newest: 'Newest', shortest: 'Shortest' },
      emptyTitle: 'No sermons found',
      emptyText: 'Try another word or remove a filter.',
      emptySaved: 'No saved sermons yet',
      emptySavedText: 'Tap the heart on a sermon to keep it here.',
      clearFilters: 'Clear filters', backAll: 'See all sermons',
      watch: 'Watch on WATV', save: 'Save', savedBtn: 'Saved', share: 'Share',
      inEnglish: 'Watch in English', inSpanish: 'Watch in Spanish', coversTitle: 'Topics it covers', related: 'Related sermons',
      copied: 'Link copied', addedSaved: 'Saved', removedSaved: 'Removed from saved',
      mentions: n => `mentioned ${n} ${n === 1 ? 'time' : 'times'}`,
      views: n => `${n.toLocaleString('en')} views`,
      min: 'min', topicMatch: 'Topic', tagMatch: 'Tag', need: 'Need',
      search: 'Search', partial: 'No exact match. Showing the closest sermons.',
      noVideo: 'This video is only available on WATV.',
      footer: 'Source: <a href="https://watvmedia.org" target="_blank" rel="noopener">watvmedia.org</a>. Links open the original video.',
    },
  };

  // Life situations a member might bring up -> topics that address them.
  const NEEDS = [
    { id: 'anger',       e: '😤', es: 'Controlar el enojo',     en: 'Control anger',         t: ['anger', 'patience', 'words'] },
    { id: 'worry',       e: '😟', es: 'Ansiedad y preocupación', en: 'Anxiety & worry',       t: ['anxiety', 'faith', 'hope'] },
    { id: 'trials',      e: '⛰️', es: 'Superar pruebas',         en: 'Overcome trials',       t: ['trials', 'persecution', 'hope'] },
    { id: 'hope',        e: '🌅', es: 'Ánimo y consuelo',        en: 'Hope & comfort',        t: ['hope', 'joy', 'heaven'] },
    { id: 'family',      e: '👨‍👩‍👧', es: 'Familia e hijos',        en: 'Family & children',     t: ['family', 'parents'] },
    { id: 'forgive',     e: '🤝', es: 'Perdonar y reconciliar',  en: 'Forgive & reconcile',   t: ['forgiveness', 'love', 'unity'] },
    { id: 'words',       e: '🗣️', es: 'Hablar con bondad',       en: 'Kind words',            t: ['words', 'lies'] },
    { id: 'humility',    e: '🌾', es: 'Humildad y orgullo',      en: 'Humility & pride',      t: ['humility', 'envy'] },
    { id: 'faith',       e: '🕊️', es: 'Fortalecer la fe',        en: 'Grow in faith',         t: ['faith', 'obedience', 'fear'] },
    { id: 'newmember',   e: '🌱', es: 'Nuevos miembros',         en: 'New members',           t: ['bible', 'salvation', 'covenant', 'baptism'] },
    { id: 'prayer',      e: '🙏', es: 'Oración',                 en: 'Prayer',                t: ['prayer', 'fasting'] },
    { id: 'gratitude',   e: '😊', es: 'Gratitud y alegría',      en: 'Gratitude & joy',       t: ['gratitude', 'joy'] },
    { id: 'sickness',    e: '🩺', es: 'Enfermedad y sanidad',    en: 'Sickness & healing',    t: ['sickness', 'hope'] },
    { id: 'money',       e: '💼', es: 'Dinero y trabajo',        en: 'Money & work',          t: ['money', 'greed', 'tithe'] },
    { id: 'repent',      e: '🔁', es: 'Arrepentimiento y cambio', en: 'Repentance & change',  t: ['repentance', 'resurrection'] },
    { id: 'love',        e: '❤️', es: 'Amor entre hermanos',     en: 'Brotherly love',        t: ['love', 'unity', 'zion'] },
    { id: 'preach',      e: '📣', es: 'Predicar el evangelio',   en: 'Preaching',             t: ['evangelism', 'service'] },
    { id: 'feasts',      e: '🍷', es: 'Pascua y fiestas',        en: 'Passover & feasts',     t: ['passover', 'feasts', 'supper', 'sabbath'] },
    { id: 'mother',      e: '💗', es: 'Dios Madre',              en: 'Heavenly Mother',       t: ['mother', 'spirit', 'zion'] },
    { id: 'father',      e: '👑', es: 'Cristo Ahnsahnghong',     en: 'Christ Ahnsahnghong',   t: ['father', 'prophecy'] },
    { id: 'heaven',      e: '☁️', es: 'Cielo y vida eterna',     en: 'Heaven & eternal life', t: ['heaven', 'salvation', 'resurrection'] },
    { id: 'worship',     e: '⛪', es: 'Culto y Día de Reposo',   en: 'Worship & Sabbath',     t: ['worship', 'sabbath'] },
  ];
  const NEED_BY_ID = new Map(NEEDS.map(n => [n.id, n]));

  // Everyday words (EN + ES) -> topics, so "I'm always angry" or "estoy triste" finds the right sermons.
  const SYNONYMS = {
    anger: 'angry anger mad rage temper control calm controlar calmar dominar furious irritated annoyed ira enojo enojado enojada enojarse coraje rabia furia molesto molesta temperamento',
    anxiety: 'anxiety anxious worry worried worrying stress stressed nervous fear afraid scared panic ansiedad ansioso ansiosa preocupacion preocupado preocupada estres estresado nervioso miedo temor panico',
    hope: 'worry worried anxious anxiety preocupacion preocupado preocupada ansiedad sad sadness depressed depression discouraged lonely loneliness grief hopeless comfort encourage tired triste tristeza deprimido deprimida depresion desanimado desanimada soledad solo sola consuelo animo cansado esperanza',
    trials: 'trial trials suffering hardship struggle struggling problem problems difficult difficulty overcome overcoming test tests pain prueba pruebas sufrimiento dificultad dificultades problema problemas superar vencer dolor tribulacion',
    family: 'family kids children child parenting parent son daughter marriage husband wife spouse home familia hijos hijo hija ninos crianza padres matrimonio esposo esposa hogar',
    parents: 'honor parents mom dad mother father honrar papa mama',
    forgiveness: 'forgive forgiveness forgiving grudge resentment reconcile conflict fight argument perdon perdonar rencor resentimiento reconciliar pelea conflicto discusion',
    words: 'words tongue gossip speech speak talk complain complaining criticism criticize insult palabras lengua chisme hablar quejarse queja criticar critica insulto',
    lies: 'lie lies lying deceit deceive mentira mentir enganar engano',
    humility: 'humble humility pride proud arrogant arrogance ego humilde humildad orgullo orgulloso arrogante soberbia',
    envy: 'envy jealous jealousy compare comparing envidia celos celoso envidioso comparar',
    faith: 'faith trust doubt doubts believe belief fe confiar confianza duda dudas creer',
    obedience: 'obey obeys obedient obedience disobey disobedient obedecer obedece obedecen obediente obediencia desobedecer desobediente rebelde',
    prayer: 'pray prayer praying orar oracion rezar',
    fasting: 'fast fasting ayuno ayunar',
    gratitude: 'thanks thankful grateful gratitude thanksgiving gracias agradecido agradecida gratitud agradecer',
    joy: 'happy happiness joy joyful feliz felicidad alegria alegre gozo',
    sickness: 'sick sickness ill illness disease health healing cancer hospital enfermo enferma enfermedad salud sanidad sanar hospital',
    money: 'money job work career business debt poor poverty finances provision dinero trabajo empleo negocio deuda pobre pobreza finanzas',
    greed: 'greed greedy materialism rich wealth avaricia codicia materialismo rico riqueza',
    tithe: 'tithe tithing offering offerings diezmo diezmar ofrenda ofrendas',
    repentance: 'repent repentance sin sins change changed arrepentimiento arrepentirse pecado pecados cambiar cambio',
    love: 'love loving brother brothers sister sisters brotherly amor amar hermano hermanos hermana hermanas',
    unity: 'unity harmony together united unidad armonia unidos juntos',
    evangelism: 'preach preaching gospel evangelize evangelism mission share predicar predicacion evangelio evangelizar mision',
    service: 'serve service sacrifice volunteer servir servicio sacrificio',
    passover: 'passover bread wine pascua pan vino',
    feasts: 'feast feasts tabernacles trumpets atonement pentecost unleavened fiesta fiestas tabernaculos trompetas expiacion pentecostes',
    sabbath: 'sabbath saturday sabado reposo',
    worship: 'worship church service attendance culto iglesia adoracion asistencia',
    heaven: 'heaven hell soul afterlife death die dying cielo infierno alma muerte morir',
    resurrection: 'resurrection transformation transform resurreccion transformacion',
    salvation: 'salvation saved eternal life salvacion salvo salva eterna',
    mother: 'mother heavenly mother madre celestial',
    father: 'ahnsahnghong father padre',
    bible: 'bible scripture scriptures study biblia escritura escrituras estudio',
    baptism: 'baptism baptized bautismo bautizar bautizado',
    patience: 'patience patient selfcontrol self control impatient paciencia paciente dominio propio impaciente',
    persecution: 'persecution mocked mockery bullied bully persecucion burla burlas',
    judgment: 'judgment judgement second coming end times juicio segunda venida fin',
    creation: 'creation creator science design creacion creador ciencia diseno',
    zion: 'zion church family sion',
    spirit: 'holy spirit bride espiritu santo esposa',
  };

  const STOP = new Set(('a an and the of to in on for with is are be am i im i\'m my me we our you your he she it they them this that ' +
    'no not dont don t how what why when where who which do does did can could should would want need help about from at by as or so ' +
    'feel feeling get getting have has more learn know video videos sermon sermons ' +
    'el la los las un una unos unas de del al y o u en con por para que como cual cuales cuando donde quien ' +
    'es son ser estar estoy esta esto este mi mis me yo tu tus su sus se le les lo nos quiero necesito ayuda ' +
    'sobre mas muy siento sentir tener tengo saber aprender video videos sermon sermones').split(' '));

  // ---------- Helpers ----------
  const $ = s => document.querySelector(s);
  const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ\s]/g, ' ');
  const words = s => norm(s).split(/\s+/).filter(Boolean);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } },
  };
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fmtDur = s => s >= 3600 ? `${Math.floor(s / 3600)}:${String(Math.floor(s % 3600 / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
    : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const thumb = (y, q = 'mqdefault') => `https://i.ytimg.com/vi/${y}/${q}.jpg`;

  // Synonym word -> topic keys
  const SYN = new Map();
  for (const [topic, list] of Object.entries(SYNONYMS)) {
    for (const w of words(list)) {
      if (!SYN.has(w)) SYN.set(w, new Set());
      SYN.get(w).add(topic);
    }
  }

  // Precompute a search index per item.
  for (const v of ITEMS) {
    v.tp = v.tp || []; v.tg = v.tg || []; v.c = v.c || []; v.w = v.w || [];
    v.tpMap = Object.fromEntries(v.tp);
    v.tpTotal = v.tp.reduce((a, [, n]) => a + n, 0);
    v._title = words(v.t);
    v._titleStr = ' ' + v._title.join(' ') + ' ';
    v._tags = words(v.tg.join(' '));
    v._cats = words(v.c.map(c => CATS[c].en + ' ' + CATS[c].es).join(' '));
    v._topics = v.tp.map(([k]) => [k, words(TOPICS[k].en + ' ' + TOPICS[k].es)]);
    v._freq = words(v.w.join(' '));
    v._sum = ' ' + words(v.s).join(' ') + ' ';
  }

  // ---------- State ----------
  const browserEs = (navigator.language || 'es').toLowerCase().startsWith('es');
  const state = {
    ui: store.get('ui', browserEs ? 'es' : 'en'),
    lang: store.get('lang', browserEs ? 'es' : 'en'),
    q: '', need: '', types: new Set(), lens: new Set(), cats: new Set(), topics: new Set(), tags: new Set(),
    sort: 'relevance', savedView: false,
  };
  let saved = new Set(store.get('saved', []));
  let results = [], shown = 0, partial = false;
  const t = k => I18N[state.ui][k];

  // ---------- URL sync ----------
  function readUrl() {
    const p = new URLSearchParams(location.search);
    if (p.has('q')) state.q = p.get('q');
    if (p.has('lang') && ['es', 'en', 'all'].includes(p.get('lang'))) state.lang = p.get('lang');
    if (p.has('need') && NEED_BY_ID.has(p.get('need'))) state.need = p.get('need');
    const set = (key, target, valid) => (p.get(key) || '').split(',').filter(x => x && valid(x)).forEach(x => target.add(x));
    set('type', state.types, x => 'srm'.includes(x));
    set('len', state.lens, x => ['short', 'medium', 'long'].includes(x));
    set('cat', state.cats, x => x in CATS);
    set('topic', state.topics, x => x in TOPICS);
    set('tag', state.tags, () => true);
    if (p.has('sort') && p.get('sort') in I18N.es.sorts) state.sort = p.get('sort');
    return p.get('v');
  }
  function writeUrl(videoId) {
    const p = new URLSearchParams();
    if (state.q) p.set('q', state.q);
    if (state.lang !== (browserEs ? 'es' : 'en')) p.set('lang', state.lang);
    if (state.need) p.set('need', state.need);
    if (state.types.size) p.set('type', [...state.types].join(','));
    if (state.lens.size) p.set('len', [...state.lens].join(','));
    if (state.cats.size) p.set('cat', [...state.cats].join(','));
    if (state.topics.size) p.set('topic', [...state.topics].join(','));
    if (state.tags.size) p.set('tag', [...state.tags].join(','));
    if (state.sort !== 'relevance') p.set('sort', state.sort);
    if (videoId) p.set('v', videoId);
    const qs = p.toString();
    history.replaceState(null, '', qs ? `?${qs}` : location.pathname);
  }

  // ---------- Search ----------
  function tokenize(q) {
    return words(q).filter(w => w.length > 1 && !STOP.has(w));
  }
  // How strongly a sermon is about a topic: its share of the sermon's topic mentions, plus raw depth.
  const topicWeight = (v, k) => {
    const n = v.tpMap[k];
    return n ? 14 * n / v.tpTotal + Math.min(n, 25) * 0.25 : 0;
  };
  const prefixHit = (list, tok) => list.some(w => w === tok || (tok.length >= 3 && w.startsWith(tok)));

  function scoreToken(v, tok) {
    let s = 0;
    if (prefixHit(v._title, tok)) s += 20;
    if (prefixHit(v._tags, tok)) s += 7;
    if (prefixHit(v._cats, tok)) s += 3;
    for (const [k, ws] of v._topics) {
      if (prefixHit(ws, tok)) s += 4 + topicWeight(v, k);
    }
    const syn = SYN.get(tok);
    if (syn) for (const k of syn) if (v.tpMap[k]) s += 4 + topicWeight(v, k);
    if (prefixHit(v._freq, tok)) s += 3;
    if (v._sum.includes(' ' + tok)) s += 2.5;
    return s;
  }

  function matchesFilters(v) {
    if (state.lang !== 'all' && v.l !== state.lang) return false;
    if (state.types.size && !state.types.has(v.k)) return false;
    if (state.lens.size) {
      const m = (v.d || 0) / 60;
      const len = m < 10 ? 'short' : m <= 30 ? 'medium' : 'long';
      if (!state.lens.has(len)) return false;
    }
    if (state.cats.size && !v.c.some(c => state.cats.has(c))) return false;
    if (state.topics.size && ![...state.topics].every(k => v.tpMap[k])) return false;
    if (state.tags.size && !v.tg.some(g => state.tags.has(g))) return false;
    if (state.need && !NEED_BY_ID.get(state.need).t.some(k => v.tpMap[k])) return false;
    return true;
  }

  function relevanceBase(v) {
    // How much the item talks about the active need / selected topics.
    let s = 0;
    if (state.need) for (const k of NEED_BY_ID.get(state.need).t) s += topicWeight(v, k);
    for (const k of state.topics) s += topicWeight(v, k);
    return s;
  }

  function compute() {
    partial = false;
    let pool = state.savedView ? [...saved].map(id => BY_ID.get(id)).filter(Boolean) : ITEMS;
    pool = pool.filter(matchesFilters);
    const toks = tokenize(state.q);
    const fullPhrase = words(state.q).join(' ');

    if (toks.length) {
      let scored = [];
      for (const v of pool) {
        let hits = 0, score = 0;
        for (const tok of toks) {
          const s = scoreToken(v, tok);
          if (s > 0) { hits++; score += s; }
        }
        if (!hits) continue;
        if (fullPhrase.length > 3 && v._titleStr.includes(' ' + fullPhrase)) score += 25;
        score += relevanceBase(v) * 0.3 + Math.log10((v.v || 0) + 10) * 0.6;
        scored.push({ v, hits, score });
      }
      // Prefer sermons that match every word; in longer questions allow one word to miss.
      const best = scored.reduce((m, x) => Math.max(m, x.hits), 0);
      const need = toks.length >= 3 ? toks.length - 1 : toks.length;
      partial = best < need;
      const strong = scored.filter(x => x.hits >= Math.min(need, best));
      strong.sort((a, b) => b.hits - a.hits || b.score - a.score);
      results = strong.map(x => x.v);
    } else {
      results = pool.slice();
      if (state.sort === 'relevance') {
        const hasFocus = state.need || state.topics.size;
        results.sort(hasFocus ? (a, b) => relevanceBase(b) - relevanceBase(a) || (b.v || 0) - (a.v || 0)
          : state.savedView ? () => 0 : (a, b) => (b.v || 0) - (a.v || 0) || (b.dt || '').localeCompare(a.dt || ''));
      }
    }
    if (state.sort === 'views') results.sort((a, b) => (b.v || 0) - (a.v || 0));
    if (state.sort === 'newest') results.sort((a, b) => (b.dt || '').localeCompare(a.dt || '') || b.id - a.id);
    if (state.sort === 'shortest') results.sort((a, b) => (a.d || 1e9) - (b.d || 1e9));
  }

  // ---------- Rendering ----------
  const grid = $('#grid');

  // Wrap words that match the query in <mark>, comparing without accents.
  function highlight(text, toks) {
    if (!toks.length) return esc(text);
    return text.split(/(\s+)/).map(p => {
      const w = norm(p).trim();
      return w && toks.some(tok => tok.length >= 3 ? w.startsWith(tok) : w === tok) ? `<mark>${esc(p)}</mark>` : esc(p);
    }).join('');
  }

  function cardHTML(v, i, toks) {
    const topicKeys = v.tp.slice(0, 2).map(([k]) => k);
    const isSaved = saved.has(v.id);
    const typeLabel = t('types')[v.k];
    const media = v.y
      ? `<img src="${thumb(v.y)}" alt="" loading="lazy" decoding="async" onload="this.classList.add('loaded')" onerror="this.remove()">`
      : '';
    const art = `<span class="art">${TOPICS[topicKeys[0]]?.e || '📖'}</span>`;
    return `<article class="card" style="--i:${i}" data-id="${v.id}" tabindex="0" role="button" aria-label="${esc(v.t)}">
      <div class="thumb" style="${gradient(v)}">${art}${media}
        <span class="play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span>
        <span class="badge b-${v.k}">${esc(typeLabel)}</span>
        ${state.lang === 'all' ? `<span class="lang-badge">${v.l.toUpperCase()}</span>` : ''}
        ${v.d ? `<span class="dur">${fmtDur(v.d)}</span>` : ''}
      </div>
      <button class="save ${isSaved ? 'on' : ''}" data-save="${v.id}" aria-pressed="${isSaved}" aria-label="${esc(t('save'))}">
        <svg viewBox="0 0 24 24"><path d="M12 20.5s-7.5-4.6-9.3-9.3C1.4 7.8 3.6 4.5 7 4.5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.4 0 5.6 3.3 4.3 6.7-1.8 4.7-9.3 9.3-9.3 9.3z"/></svg>
      </button>
      <div class="c-body">
        <h3 class="c-title">${highlight(v.t, toks)}</h3>
        ${v.s ? `<p class="c-desc">${highlight(v.s, toks)}</p>` : ''}
        <div class="c-foot">
          ${topicKeys.map(k => `<span class="pill">${TOPICS[k].e} ${esc(topicLabel(k))}</span>`).join('')}
          ${!topicKeys.length && v.tg[0] ? `<span class="pill">#${esc(v.tg[0])}</span>` : ''}
        </div>
      </div>
    </article>`;
  }

  // Stable soft gradient per item (shown while the thumbnail loads, or if it is missing).
  function gradient(v) {
    const h = (v.id * 47) % 360;
    return `--c1:hsl(${h} 60% 55%);--c2:hsl(${(h + 50) % 360} 65% 45%)`;
  }

  function topicLabel(k) {
    const l = TOPICS[k][state.ui];
    return l.replace(/\s*\(.*\)$/, '');
  }

  function renderResults(reset = true) {
    const toks = tokenize(state.q);
    if (reset) {
      shown = 0;
      grid.innerHTML = '';
    }
    const next = results.slice(shown, shown + PAGE);
    grid.insertAdjacentHTML('beforeend', next.map((v, i) => cardHTML(v, i, toks)).join(''));
    shown += next.length;

    const n = results.length;
    $('#resultMeta').innerHTML = (state.savedView ? t('savedResults')(n) : t('results')(n))
      + (partial ? `<span class="partial">${esc(t('partial'))}</span>` : '');
    $('#applyBtn').textContent = t('show')(n);

    const empty = $('#empty');
    empty.hidden = n > 0;
    if (!n) {
      const savedEmpty = state.savedView && !saved.size;
      $('#emptyTitle').textContent = savedEmpty ? t('emptySaved') : t('emptyTitle');
      $('#emptyText').textContent = savedEmpty ? t('emptySavedText') : t('emptyText');
      $('#emptyReset').textContent = savedEmpty ? t('backAll') : t('clearFilters');
    }
  }

  function renderActive() {
    const chips = [];
    if (state.q) chips.push(['q', '', `🔎 “${state.q}”`]);
    if (state.need) { const n = NEED_BY_ID.get(state.need); chips.push(['need', n.id, `${n.e} ${n[state.ui]}`]); }
    for (const k of state.types) chips.push(['type', k, t('types')[k]]);
    for (const k of state.lens) chips.push(['len', k, t('lens')[k]]);
    for (const k of state.cats) chips.push(['cat', k, CATS[k][state.ui]]);
    for (const k of state.topics) chips.push(['topic', k, `${TOPICS[k].e} ${topicLabel(k)}`]);
    for (const k of state.tags) chips.push(['tag', k, `#${k}`]);
    $('#active').innerHTML = chips.map(([g, k, label]) =>
      `<button class="achip" data-g="${g}" data-k="${esc(k)}">${esc(label)}<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button>`).join('')
      + (chips.length > 1 ? `<button class="link-btn" data-g="all">${esc(t('reset'))}</button>` : '');
    const fc = state.types.size + state.lens.size + state.cats.size + state.topics.size + state.tags.size;
    const fcEl = $('#filterCount');
    fcEl.hidden = !fc; fcEl.textContent = fc;
  }

  function optHTML(group, key, label, count, on) {
    return `<button class="opt ${on ? 'on' : ''}" data-g="${group}" data-k="${esc(key)}" aria-pressed="${on}" ${!count && !on ? 'disabled' : ''}>
      <span class="o-label">${label}</span><span class="o-count">${count}</span></button>`;
  }

  function renderFilters() {
    // Counts per option ignore that group's own selection, so the numbers show what you'd get by adding it.
    const without = group => {
      const saveSet = state[group];
      state[group] = new Set();
      const list = (state.savedView ? [...saved].map(id => BY_ID.get(id)).filter(Boolean) : ITEMS).filter(matchesFilters);
      state[group] = saveSet;
      return list;
    };
    const tally = (list, fn) => { const m = new Map(); for (const v of list) for (const k of fn(v)) m.set(k, (m.get(k) || 0) + 1); return m; };

    const typeCounts = tally(without('types'), v => [v.k]);
    $('#typeOpts').innerHTML = ['s', 'r', 'm'].map(k => optHTML('type', k, esc(t('types')[k]), typeCounts.get(k) || 0, state.types.has(k))).join('');

    const lenCounts = tally(without('lens'), v => { const m = (v.d || 0) / 60; return [m < 10 ? 'short' : m <= 30 ? 'medium' : 'long']; });
    $('#lenOpts').innerHTML = ['short', 'medium', 'long'].map(k => optHTML('len', k, esc(t('lens')[k]), lenCounts.get(k) || 0, state.lens.has(k))).join('');

    const catCounts = tally(without('cats'), v => v.c);
    $('#catOpts').innerHTML = Object.keys(CATS).filter(k => catCounts.get(k) || state.cats.has(k))
      .map(k => optHTML('cat', k, esc(CATS[k][state.ui]), catCounts.get(k) || 0, state.cats.has(k))).join('');

    const topicCounts = tally(without('topics'), v => v.tp.map(([k]) => k));
    const tf = norm($('#topicFilter').value).trim();
    $('#topicOpts').innerHTML = Object.keys(TOPICS)
      .filter(k => (topicCounts.get(k) || state.topics.has(k)) && (!tf || norm(TOPICS[k].en + ' ' + TOPICS[k].es).includes(tf)))
      .sort((a, b) => (state.topics.has(b) - state.topics.has(a)) || topicLabel(a).localeCompare(topicLabel(b), state.ui))
      .map(k => optHTML('topic', k, `${TOPICS[k].e} ${esc(topicLabel(k))}`, topicCounts.get(k) || 0, state.topics.has(k))).join('');

    const tagCounts = tally(without('tags'), v => v.tg);
    $('#tagOpts').innerHTML = [...tagCounts.entries()].concat([...state.tags].filter(k => !tagCounts.has(k)).map(k => [k, 0]))
      .sort((a, b) => (state.tags.has(b[0]) - state.tags.has(a[0])) || b[1] - a[1]).slice(0, 40)
      .map(([k, n]) => optHTML('tag', k, `#${esc(k)}`, n, state.tags.has(k))).join('');
  }

  let needsExpanded = false;
  function renderNeeds() {
    const lim = needsExpanded ? NEEDS.length : 10;
    $('#needs').innerHTML = NEEDS.slice(0, lim).map((n, i) =>
      `<button class="need ${state.need === n.id ? 'on' : ''}" data-need="${n.id}" style="--i:${i}" aria-pressed="${state.need === n.id}">
        <span class="n-e">${n.e}</span><span class="n-l">${esc(n[state.ui])}</span></button>`).join('');
    $('#needsMore').textContent = needsExpanded ? t('seeLess') : t('seeAll');
  }

  function renderSort() {
    $('#sortSel').innerHTML = Object.entries(t('sorts')).map(([k, l]) => `<option value="${k}" ${state.sort === k ? 'selected' : ''}>${esc(l)}</option>`).join('');
  }

  function renderStatic() {
    document.documentElement.lang = state.ui;
    document.title = state.ui === 'es' ? 'Buscador de Sermones WATV' : 'WATV Sermon Finder';
    document.querySelectorAll('[data-i18n]').forEach(el => { const v = t(el.dataset.i18n); if (typeof v === 'string') el.textContent = v; });
    document.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = t(el.dataset.i18nHtml); });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => { el.placeholder = t(el.dataset.i18nPlaceholder); });
    document.querySelectorAll('[data-i18n-label]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.i18nLabel)); });
    document.querySelectorAll('[data-ui-lang]').forEach(b => b.setAttribute('aria-pressed', b.dataset.uiLang === state.ui));
    document.querySelectorAll('[data-lang]').forEach(b => b.setAttribute('aria-pressed', b.dataset.lang === state.lang));
    $('#libStat').textContent = t('libStat')(ITEMS.length);
    $('#savedBtn').setAttribute('aria-label', t('saved'));
    renderSort();
  }

  function update({ scroll = false, url = true } = {}) {
    compute();
    renderResults();
    renderActive();
    renderFilters();
    renderNeeds();
    if (url) writeUrl();
    if (scroll) scrollToResults();
  }

  function scrollToResults() {
    const top = $('#results').getBoundingClientRect().top + scrollY - $('#topbar').offsetHeight - 8;
    if (scrollY > top + 40 || scrollY < top - 40) scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  // Infinite scroll
  new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && shown < results.length) renderResults(false);
  }, { rootMargin: '600px' }).observe($('#sentinel'));

  // ---------- Suggestions (autocomplete) ----------
  const suggestEl = $('#suggest');
  let sugIndex = -1, sugItems = [];
  function renderSuggest() {
    const qn = norm(state.q).trim();
    if (qn.length < 2) { hideSuggest(); return; }
    const out = [];
    for (const n of NEEDS) if (norm(n.es + ' ' + n.en).includes(qn)) out.push({ kind: 'need', key: n.id, label: `${n.e} ${n[state.ui]}`, sub: t('need') });
    for (const [k, tp] of Object.entries(TOPICS)) {
      const hay = norm(tp.en + ' ' + tp.es);
      const syn = tokenize(state.q).some(tok => SYN.get(tok)?.has(k));
      if (hay.includes(qn) || syn) out.push({ kind: 'topic', key: k, label: `${tp.e} ${topicLabel(k)}`, sub: t('topicMatch') });
    }
    const tagSeen = new Set();
    for (const v of ITEMS) {
      if (state.lang !== 'all' && v.l !== state.lang) continue;
      for (const g of v.tg) if (!tagSeen.has(g) && norm(g).includes(qn)) { tagSeen.add(g); out.push({ kind: 'tag', key: g, label: `#${g}`, sub: t('tagMatch') }); }
    }
    sugItems = out.slice(0, 7);
    if (!sugItems.length) { hideSuggest(); return; }
    sugIndex = -1;
    suggestEl.innerHTML = sugItems.map((s, i) =>
      `<li role="option" id="sug${i}" data-i="${i}"><span>${esc(s.label)}</span><small>${esc(s.sub)}</small></li>`).join('');
    suggestEl.hidden = false;
    $('#q').setAttribute('aria-expanded', 'true');
  }
  function hideSuggest() {
    suggestEl.hidden = true; sugIndex = -1;
    $('#q').setAttribute('aria-expanded', 'false');
    $('#q').removeAttribute('aria-activedescendant');
  }
  function pickSuggest(i) {
    const s = sugItems[i];
    if (!s) return;
    state.q = ''; $('#q').value = '';
    if (s.kind === 'need') state.need = s.key;
    if (s.kind === 'topic') state.topics.add(s.key);
    if (s.kind === 'tag') state.tags.add(s.key);
    syncClear(); hideSuggest(); $('#q').blur();
    update({ scroll: true });
  }

  // ---------- Modal ----------
  const modal = $('#modal');
  let current = null;

  function openVideo(id, push = true) {
    const v = BY_ID.get(+id);
    if (!v) return;
    current = v;
    const recent = store.get('recent', []).filter(x => x !== v.id);
    recent.unshift(v.id); store.set('recent', recent.slice(0, 30));

    $('#mPlayer').style.cssText = gradient(v);
    $('#mPlayer').innerHTML = v.y
      ? `<button class="poster" id="mPoster" aria-label="Play">
           <img src="${thumb(v.y, 'hqdefault')}" alt="" onerror="this.remove()">
           <span class="play big"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span></button>`
      : `<div class="poster"><span class="art">${TOPICS[v.tp[0]?.[0]]?.e || '📖'}</span><p>${esc(t('noVideo'))}</p></div>`;
    const poster = $('#mPoster');
    if (poster) poster.addEventListener('click', () => {
      $('#mPlayer').innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${v.y}?autoplay=1&rel=0&modestbranding=1&playsinline=1"
        title="${esc(v.t)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
    });

    $('#mKicker').innerHTML = `<span class="badge b-${v.k}">${esc(t('types')[v.k])}</span>`
      + v.c.map(c => `<span class="pill">${esc(CATS[c][state.ui])}</span>`).join('')
      + `<span class="pill">${v.l === 'es' ? 'Español' : 'English'}</span>`;
    $('#mTitle').textContent = v.t;
    const meta = [];
    if (v.d) meta.push(`⏱ ${fmtDur(v.d)}`);
    if (v.dt) meta.push('📅 ' + new Date(v.dt + 'T12:00').toLocaleDateString(state.ui, { day: 'numeric', month: 'short', year: 'numeric' }));
    if (v.v) meta.push('👁 ' + t('views')(v.v));
    $('#mMeta').textContent = meta.join('  ·  ');
    $('#mDesc').textContent = v.s || '';
    $('#mWatch').href = v.u || (v.y ? `https://youtu.be/${v.y}` : '#');
    $('#mWatch').textContent = t('watch');
    $('#mShare').textContent = t('share');
    syncModalSave();

    const alt = v.alt && BY_ID.get(v.alt);
    $('#mAlt').hidden = !alt;
    if (alt) {
      $('#mAlt').dataset.id = alt.id;
      $('#mAlt').textContent = alt.l === 'en' ? t('inEnglish') : t('inSpanish');
    }

    const max = Math.max(1, ...v.tp.map(([, n]) => n));
    $('#mTopicsWrap').hidden = !v.tp.length;
    $('#mTopics').innerHTML = v.tp.map(([k, n], i) =>
      `<button class="bar" data-topic="${k}" style="--w:${Math.round(n / max * 100)}%;--i:${i}" title="${esc(t('mentions')(n))}">
        <span class="bar-l">${TOPICS[k].e} ${esc(topicLabel(k))}</span><span class="bar-n">${n}</span><span class="bar-fill"></span></button>`).join('');
    $('#mTags').innerHTML = v.tg.map(g => `<button class="tag" data-tag="${esc(g)}">#${esc(g)}</button>`).join('');

    const rel = related(v);
    $('#mRelatedWrap').hidden = !rel.length;
    $('#mRelated').innerHTML = rel.map(r => `<button class="rel" data-id="${r.id}">
      <span class="mini" style="${gradient(r)}">${r.y ? `<img src="${thumb(r.y, 'default')}" alt="" loading="lazy" onerror="this.remove()">` : ''}</span>
      <span><b>${esc(r.t)}</b><small>${r.d ? fmtDur(r.d) : ''} · ${esc(t('types')[r.k])}</small></span></button>`).join('');

    $('#modalCard').scrollTop = 0;
    if (!modal.open) {
      modal.showModal();
      document.body.classList.add('locked');
    }
    if (push) writeUrl(v.id);
  }

  function related(v) {
    if (!v.tp.length) return [];
    const scored = [];
    for (const o of ITEMS) {
      if (o.id === v.id || o.l !== v.l || o.id === v.alt) continue;
      let s = 0;
      for (const [k, n] of v.tp) if (o.tpMap[k]) s += Math.min(n, o.tpMap[k]);
      if (s) scored.push([s / Math.sqrt(o.tpTotal + 5), o]);
    }
    return scored.sort((a, b) => b[0] - a[0]).slice(0, 6).map(x => x[1]);
  }

  function closeModal() {
    if (!modal.open) return;
    const done = () => {
      modal.classList.remove('closing');
      modal.close();
      $('#mPlayer').innerHTML = '';
      document.body.classList.remove('locked');
      writeUrl();
    };
    if (reduceMotion) return done();
    modal.classList.add('closing');
    setTimeout(done, 220);
  }

  function syncModalSave() {
    if (!current) return;
    const on = saved.has(current.id);
    $('#mSave').innerHTML = `<svg viewBox="0 0 24 24" class="${on ? 'filled' : ''}"><path d="M12 20.5s-7.5-4.6-9.3-9.3C1.4 7.8 3.6 4.5 7 4.5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.4 0 5.6 3.3 4.3 6.7-1.8 4.7-9.3 9.3-9.3 9.3z"/></svg> ${esc(on ? t('savedBtn') : t('save'))}`;
    $('#mSave').classList.toggle('on', on);
  }

  // ---------- Saved ----------
  function toggleSave(id) {
    id = +id;
    if (saved.has(id)) { saved.delete(id); toast(t('removedSaved')); }
    else { saved.add(id); toast('❤️ ' + t('addedSaved')); }
    store.set('saved', [...saved]);
    syncSavedCount(true);
    document.querySelectorAll(`[data-save="${id}"]`).forEach(b => {
      const on = saved.has(id);
      b.classList.toggle('on', on); b.setAttribute('aria-pressed', on);
      b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
    });
    syncModalSave();
    if (state.savedView) { compute(); renderResults(); renderFilters(); }
  }
  function syncSavedCount(bump) {
    const c = $('#savedCount');
    c.hidden = !saved.size; c.textContent = saved.size;
    if (bump) { c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump'); }
  }

  // ---------- Toast ----------
  let toastTimer;
  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg; el.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 2000);
  }

  // ---------- Filters sheet (mobile) ----------
  const isSheet = () => matchMedia('(max-width: 900px)').matches;
  function openFilters() {
    $('#filters').classList.add('open'); $('#scrim').hidden = false;
    requestAnimationFrame(() => $('#scrim').classList.add('show'));
    document.body.classList.add('locked');
  }
  function closeFilters() {
    $('#filters').classList.remove('open'); $('#scrim').classList.remove('show');
    setTimeout(() => { $('#scrim').hidden = true; }, 300);
    document.body.classList.remove('locked');
  }

  // ---------- Events ----------
  const qEl = $('#q');
  let debounce;
  function syncClear() { $('#clearBtn').hidden = !qEl.value; }
  qEl.addEventListener('input', () => {
    state.q = qEl.value; syncClear(); renderSuggest();
    clearTimeout(debounce); debounce = setTimeout(() => update(), 140);
  });
  qEl.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (suggestEl.hidden) return;
      e.preventDefault();
      // Cycle through the suggestions, with -1 meaning "back in the text box".
      const n = sugItems.length + 1;
      sugIndex = ((sugIndex + 1 + (e.key === 'ArrowDown' ? 1 : -1)) % n + n) % n - 1;
      suggestEl.querySelectorAll('li').forEach((li, i) => li.classList.toggle('on', i === sugIndex));
      if (sugIndex >= 0) qEl.setAttribute('aria-activedescendant', `sug${sugIndex}`); else qEl.removeAttribute('aria-activedescendant');
    } else if (e.key === 'Enter') {
      if (sugIndex >= 0) { e.preventDefault(); pickSuggest(sugIndex); }
      else { hideSuggest(); clearTimeout(debounce); update({ scroll: true }); qEl.blur(); }
    } else if (e.key === 'Escape') {
      if (!suggestEl.hidden) hideSuggest(); else { qEl.value = ''; state.q = ''; syncClear(); update(); }
    }
  });
  qEl.addEventListener('blur', () => setTimeout(hideSuggest, 150));
  qEl.addEventListener('focus', renderSuggest);
  suggestEl.addEventListener('mousedown', e => { const li = e.target.closest('li'); if (li) { e.preventDefault(); pickSuggest(+li.dataset.i); } });
  $('#clearBtn').addEventListener('click', () => { qEl.value = ''; state.q = ''; syncClear(); hideSuggest(); update(); qEl.focus(); });

  // Voice search where the browser supports it (Chrome, Edge, Safari on iOS).
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SR) {
    const mic = $('#micBtn');
    mic.hidden = false;
    let rec = null;
    mic.addEventListener('click', () => {
      if (rec) { rec.stop(); return; }
      rec = new SR();
      rec.lang = state.ui === 'es' ? 'es-ES' : 'en-US';
      rec.interimResults = true;
      rec.onresult = e => { qEl.value = [...e.results].map(r => r[0].transcript).join(' '); state.q = qEl.value; syncClear(); update(); };
      rec.onend = () => { mic.classList.remove('listening'); rec = null; scrollToResults(); };
      rec.onerror = () => { mic.classList.remove('listening'); rec = null; };
      mic.classList.add('listening');
      rec.start();
    });
  }

  document.addEventListener('keydown', e => {
    if (e.key === '/' && document.activeElement !== qEl && !/input|select|textarea/i.test(document.activeElement.tagName) && !modal.open) {
      e.preventDefault(); qEl.focus(); qEl.select();
    }
    if (e.key === 'Escape' && $('#filters').classList.contains('open')) closeFilters();
  });

  $('#langSeg').addEventListener('click', e => {
    const b = e.target.closest('[data-lang]'); if (!b) return;
    state.lang = b.dataset.lang; store.set('lang', state.lang);
    state.tags.clear(); // tags are language-specific
    document.querySelectorAll('[data-lang]').forEach(x => x.setAttribute('aria-pressed', x === b));
    update();
  });
  document.querySelectorAll('[data-ui-lang]').forEach(b => b.addEventListener('click', () => {
    state.ui = b.dataset.uiLang; store.set('ui', state.ui);
    renderStatic(); update({ url: false });
  }));

  $('#needs').addEventListener('click', e => {
    const b = e.target.closest('[data-need]'); if (!b) return;
    state.need = state.need === b.dataset.need ? '' : b.dataset.need;
    update({ scroll: !!state.need });
  });
  $('#needsMore').addEventListener('click', () => { needsExpanded = !needsExpanded; renderNeeds(); });

  const groupSet = { type: 'types', len: 'lens', cat: 'cats', topic: 'topics', tag: 'tags' };
  $('#filters').addEventListener('click', e => {
    const b = e.target.closest('.opt'); if (!b) return;
    const set = state[groupSet[b.dataset.g]];
    set.has(b.dataset.k) ? set.delete(b.dataset.k) : set.add(b.dataset.k);
    update();
  });
  $('#topicFilter').addEventListener('input', renderFilters);

  $('#active').addEventListener('click', e => {
    const b = e.target.closest('[data-g]'); if (!b) return;
    const { g, k } = b.dataset;
    if (g === 'all') return resetAll();
    if (g === 'q') { state.q = ''; qEl.value = ''; syncClear(); }
    else if (g === 'need') state.need = '';
    else state[groupSet[g]].delete(k);
    update();
  });

  function resetAll() {
    state.q = ''; qEl.value = ''; state.need = '';
    ['types', 'lens', 'cats', 'topics', 'tags'].forEach(k => state[k].clear());
    $('#topicFilter').value = '';
    syncClear(); update();
  }
  $('#resetBtn').addEventListener('click', resetAll);
  $('#emptyReset').addEventListener('click', () => {
    if (state.savedView && !saved.size) setSavedView(false); else resetAll();
  });

  $('#sortSel').addEventListener('change', e => { state.sort = e.target.value; update(); });

  $('#filtersBtn').addEventListener('click', openFilters);
  $('#filtersClose').addEventListener('click', closeFilters);
  $('#applyBtn').addEventListener('click', () => { closeFilters(); scrollToResults(); });
  $('#scrim').addEventListener('click', closeFilters);

  function setSavedView(on) {
    state.savedView = on;
    $('#savedBtn').setAttribute('aria-pressed', on);
    document.body.classList.toggle('saved-view', on);
    update({ scroll: on });
  }
  $('#savedBtn').addEventListener('click', () => setSavedView(!state.savedView));

  grid.addEventListener('click', e => {
    const s = e.target.closest('[data-save]');
    if (s) { e.stopPropagation(); toggleSave(s.dataset.save); return; }
    const c = e.target.closest('.card'); if (c) openVideo(c.dataset.id);
  });
  grid.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('card')) { e.preventDefault(); openVideo(e.target.dataset.id); }
  });

  $('#mClose').addEventListener('click', closeModal);
  modal.addEventListener('cancel', e => { e.preventDefault(); closeModal(); });
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  $('#mSave').addEventListener('click', () => current && toggleSave(current.id));
  $('#mAlt').addEventListener('click', e => openVideo(e.currentTarget.dataset.id));
  $('#mRelated').addEventListener('click', e => { const b = e.target.closest('[data-id]'); if (b) openVideo(b.dataset.id); });
  $('#mTopics').addEventListener('click', e => {
    const b = e.target.closest('[data-topic]'); if (!b) return;
    closeModal(); state.q = ''; qEl.value = ''; syncClear();
    state.topics = new Set([b.dataset.topic]); state.need = '';
    setTimeout(() => update({ scroll: true }), 230);
  });
  $('#mTags').addEventListener('click', e => {
    const b = e.target.closest('[data-tag]'); if (!b) return;
    closeModal(); state.q = ''; qEl.value = ''; syncClear();
    state.tags = new Set([b.dataset.tag]); state.need = '';
    if (current && state.lang !== 'all' && current.l !== state.lang) { state.lang = current.l; renderStatic(); }
    setTimeout(() => update({ scroll: true }), 230);
  });
  $('#mShare').addEventListener('click', async () => {
    if (!current) return;
    const url = new URL(location.href);
    url.search = `?v=${current.id}`;
    const data = { title: current.t, text: current.t, url: url.toString() };
    try {
      if (navigator.share && matchMedia('(pointer: coarse)').matches) await navigator.share(data);
      else { await navigator.clipboard.writeText(`${current.t}\n${url}`); toast('🔗 ' + t('copied')); }
    } catch { /* user cancelled */ }
  });

  // Swipe down to close the bottom sheets on phones.
  function swipeToClose(el, handleSel, onClose) {
    let y0 = null, dy = 0;
    el.addEventListener('touchstart', e => {
      const scroller = el.querySelector('.f-scroll') || el;
      if (!e.target.closest(handleSel) && scroller.scrollTop > 0) return;
      y0 = e.touches[0].clientY; dy = 0;
    }, { passive: true });
    el.addEventListener('touchmove', e => {
      if (y0 == null) return;
      dy = Math.max(0, e.touches[0].clientY - y0);
      if (dy > 0) { el.style.transition = 'none'; el.style.transform = `translateY(${dy}px)`; }
    }, { passive: true });
    el.addEventListener('touchend', () => {
      if (y0 == null) return;
      el.style.transition = ''; el.style.transform = '';
      if (dy > 110) onClose();
      y0 = null;
    });
  }
  swipeToClose($('#filters'), '.sheet-handle, .f-head', () => isSheet() && closeFilters());
  swipeToClose($('#modalCard'), '.sheet-handle', () => matchMedia('(max-width: 640px)').matches && closeModal());

  // Theme
  const themeBtn = $('#themeBtn');
  const savedTheme = store.get('theme', null);
  if (savedTheme) document.documentElement.dataset.theme = savedTheme;
  themeBtn.addEventListener('click', () => {
    const dark = document.documentElement.dataset.theme
      ? document.documentElement.dataset.theme === 'dark'
      : matchMedia('(prefers-color-scheme: dark)').matches;
    const next = dark ? 'light' : 'dark';
    document.documentElement.dataset.theme = next; store.set('theme', next);
  });

  // Top bar shadow + back-to-top
  const onScroll = () => {
    $('#topbar').classList.toggle('scrolled', scrollY > 8);
    $('#toTop').classList.toggle('show', scrollY > 900);
  };
  addEventListener('scroll', onScroll, { passive: true });
  $('#toTop').addEventListener('click', () => scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));

  // ---------- Start ----------
  const deepVideo = readUrl();
  qEl.value = state.q; syncClear();
  renderStatic();
  syncSavedCount(false);
  update({ url: false });
  if (deepVideo && BY_ID.has(+deepVideo)) openVideo(deepVideo, false);

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
})();
