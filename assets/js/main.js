/* =========================================================
   ORL Nad jazerom – skripty webu
   Menu, ordinačné hodiny „dnes“, oznamy, mapa, meranie a súhlas s cookies.
   Údaje na úpravu sú v súbore nastavenia.js.
   ========================================================= */
(function () {
  'use strict';

  var N = window.ORL_NASTAVENIA || {};
  var doc = document;
  var html = doc.documentElement;
  var koren = (doc.body && doc.body.getAttribute('data-koren')) || '';
  window.dataLayer = window.dataLayer || [];

  /* --- Režim kontroly obsahu: pridajte ?overit na koniec adresy --- */
  if (/[?&]overit\b/.test(location.search)) html.classList.add('rezim-overit');

  /* --- Náhľad priamo zo súboru (dvojklik na index.html) --- */
  if (location.protocol === 'file:') {
    doc.querySelectorAll('a[href]').forEach(function (a) {
      try {
        var u = new URL(a.href);
        if (u.protocol === 'file:' && /\/$/.test(u.pathname)) { u.pathname += 'index.html'; a.href = u.href; }
      } catch (e) { /* nič */ }
    });
  }

  /* --- Posun stránky: tieň hlavičky, bočný ukazovateľ, krúžok „hore“ a aktívna časť v páse odkazov --- */
  var posun = doc.querySelector('.posun');
  var posunVypln = posun && posun.querySelector('.posun__vypln');
  var posunKruzok = posun && posun.querySelector('.posun__kruzok');
  var hore = doc.querySelector('.hore');
  var pas = doc.querySelector('.kotvy-pas');
  var pasZoznam = pas && pas.querySelector('.kotvy-pas__zoznam');
  var pasOdkazy = pas ? [].slice.call(pas.querySelectorAll('a[href^="#"]')) : [];
  var pasCiele = pasOdkazy.map(function (a) { return doc.getElementById(decodeURIComponent(a.hash.slice(1))); });
  var aktivna = -2;
  var cakaNaSnimku = false;

  function nastavAktivnu(i) {
    if (i === aktivna) return;
    aktivna = i;
    pasOdkazy.forEach(function (a, j) {
      var je = j === i;
      a.classList.toggle('je-aktivna', je);
      if (je) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
    if (i >= 0 && pasZoznam && pasZoznam.scrollWidth > pasZoznam.clientWidth + 2) {
      var a = pasOdkazy[i];
      var ciel = a.offsetLeft - (pasZoznam.clientWidth - a.offsetWidth) / 2;
      try { pasZoznam.scrollTo({ left: Math.max(0, ciel), behavior: 'smooth' }); } catch (e) { pasZoznam.scrollLeft = ciel; }
    }
  }

  function aktualizujPosun() {
    cakaNaSnimku = false;
    var y = window.scrollY || window.pageYOffset;
    var vyska = doc.documentElement.scrollHeight - window.innerHeight;
    var p = vyska > 0 ? Math.min(1, Math.max(0, y / vyska)) : 0;
    html.classList.toggle('je-posunute', y > 4);
    if (posun) {
      posunVypln.style.transform = 'scaleY(' + p.toFixed(4) + ')';
      posunKruzok.style.transform = 'translateY(' + (p * posun.clientHeight).toFixed(1) + 'px)';
    }
    if (hore) hore.classList.toggle('je-viditelne', y > window.innerHeight * 0.6);
    if (pas) {
      var dole = pas.getBoundingClientRect().bottom;
      var prilepeny = pas.getBoundingClientRect().top <= parseFloat(getComputedStyle(pas).top) + 1 && y > 0;
      pas.classList.toggle('je-prilepeny', prilepeny);
      var hranica = dole + 32;
      var akt = -1;
      if (prilepeny) {
        pasCiele.forEach(function (el, j) { if (el && el.getBoundingClientRect().top <= hranica) akt = j; });
        if (y >= vyska - 2 && pasCiele.length) akt = pasCiele.length - 1;
      }
      nastavAktivnu(akt);
    }
  }
  function naPosun() {
    if (!cakaNaSnimku) { cakaNaSnimku = true; window.requestAnimationFrame(aktualizujPosun); }
  }
  aktualizujPosun();
  window.addEventListener('scroll', naPosun, { passive: true });
  window.addEventListener('resize', naPosun);
  window.addEventListener('load', naPosun);

  if (hore) {
    hore.addEventListener('click', function () {
      var plynulo = !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      try { window.scrollTo({ top: 0, behavior: plynulo ? 'smooth' : 'auto' }); } catch (e) { window.scrollTo(0, 0); }
      var logo = doc.querySelector('.logo');
      if (logo) { try { logo.focus({ preventScroll: true }); } catch (e) { /* nič */ } }
    });
  }

  /* --- Mobilné menu --- */
  var menuBtn = doc.querySelector('.menu-btn');
  var menu = doc.getElementById('menu');
  if (menuBtn && menu) {
    var zatvorMenu = function () {
      menuBtn.setAttribute('aria-expanded', 'false');
      html.classList.remove('menu-otvorene');
    };
    menuBtn.addEventListener('click', function () {
      var otvor = menuBtn.getAttribute('aria-expanded') !== 'true';
      menuBtn.setAttribute('aria-expanded', String(otvor));
      html.classList.toggle('menu-otvorene', otvor);
    });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) zatvorMenu(); });
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && html.classList.contains('menu-otvorene')) { zatvorMenu(); menuBtn.focus(); }
    });
    var mq = window.matchMedia('(min-width: 72em)');
    if (mq.addEventListener) mq.addEventListener('change', zatvorMenu); else if (mq.addListener) mq.addListener(zatvorMenu);
  }

  /* --- Dátum a čas v Bratislave/Košiciach --- */
  var DNI = ['pondelok', 'utorok', 'streda', 'štvrtok', 'piatok', 'sobota', 'nedeľa'];
  var DNI_V = ['v pondelok', 'v utorok', 'v stredu', 'vo štvrtok', 'v piatok', 'v sobotu', 'v nedeľu'];

  function teraz() {
    var p = {};
    try {
      new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Bratislava', year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
      }).formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
    } catch (e) {
      var d = new Date();
      p = { year: String(d.getFullYear()), month: ('0' + (d.getMonth() + 1)).slice(-2), day: ('0' + d.getDate()).slice(-2), hour: String(d.getHours()), minute: String(d.getMinutes()) };
    }
    var datum = p.year + '-' + p.month + '-' + p.day;
    return { datum: datum, den: denTyzdna(datum), min: (+p.hour % 24) * 60 + (+p.minute) };
  }
  function denTyzdna(datum) { var d = new Date(datum + 'T12:00:00Z').getUTCDay(); return d === 0 ? 7 : d; }
  function pridajDni(datum, n) { var d = new Date(datum + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
  function naMin(s) { var a = s.split(':'); return (+a[0]) * 60 + (+a[1]); }
  function cas(m) { return Math.floor(m / 60) + ':' + ('0' + (m % 60)).slice(-2); }
  function datumSk(datum) { var a = datum.split('-'); return (+a[2]) + '. ' + (+a[1]) + '.'; }

  var oznamy = Array.isArray(N.oznamy) ? N.oznamy.filter(function (o) { return o && o.od; }) : [];
  function jeZatvorene(datum) {
    return oznamy.some(function (o) { return o.zatvorene && o.od <= datum && datum <= (o.do || o.od); });
  }

  /* --- Oznam navrchu stránky --- */
  var t = teraz();
  var oznamEl = doc.querySelector('[data-oznam]');
  if (oznamEl) {
    var aktivne = oznamy.filter(function (o) {
      return (o.zobrazitOd || o.od) <= t.datum && t.datum <= (o.do || o.od) && o.text;
    });
    if (aktivne.length) {
      var textEl = oznamEl.querySelector('[data-oznam-text]');
      aktivne.forEach(function (o) { var p = doc.createElement('p'); p.textContent = o.text; textEl.appendChild(p); });
      oznamEl.hidden = false;
    }
  }

  /* --- Ordinačné hodiny: dnešný deň a stav --- */
  var hodiny = {};
  doc.querySelectorAll('[data-hodiny-zdroj] [data-den]').forEach(function (li) {
    var den = +li.getAttribute('data-den');
    var h = (li.getAttribute('data-hodiny') || '').trim();
    hodiny[den] = h ? h.split(',').map(function (int) {
      var x = int.split('-'); return [naMin(x[0].trim()), naMin(x[1].trim())];
    }) : [];
  });

  function intervaly(datum) { return jeZatvorene(datum) ? [] : (hodiny[denTyzdna(datum)] || []); }

  function najblizsie() {
    for (var d = 0; d < 28; d++) {
      var datum = pridajDni(t.datum, d);
      var ints = intervaly(datum);
      for (var k = 0; k < ints.length; k++) {
        if (d === 0 && ints[k][0] <= t.min) continue;
        return { d: d, datum: datum, den: denTyzdna(datum), od: ints[k][0] };
      }
    }
    return null;
  }

  function kedy(n) {
    if (!n) return '';
    if (n.d === 0) return 'dnes o ' + cas(n.od);
    if (n.d === 1) return 'zajtra o ' + cas(n.od);
    if (n.d < 7) return DNI_V[n.den - 1] + ' o ' + cas(n.od);
    return datumSk(n.datum) + ' o ' + cas(n.od);
  }

  if (Object.keys(hodiny).length) {
    var dnes = intervaly(t.datum);
    var zatvoreneOznamom = jeZatvorene(t.datum);
    var aktualny = null;
    dnes.forEach(function (i) { if (t.min >= i[0] && t.min < i[1]) aktualny = i; });
    var dalsie = najblizsie();
    var dnesText = dnes.length ? dnes.map(function (i) { return cas(i[0]) + ' – ' + cas(i[1]); }).join(', ') : 'Neordinujeme';

    var stavText, stavOtvorene = false, dalsieText = '';
    if (aktualny) {
      stavText = 'Teraz ordinujeme'; stavOtvorene = true;
      dalsieText = 'Ordinujeme do ' + cas(aktualny[1]) + '.';
    } else if (dalsie && dalsie.d === 0) {
      stavText = 'Otvárame o ' + cas(dalsie.od);
      dalsieText = '';
    } else {
      stavText = zatvoreneOznamom ? 'Dnes neordinujeme' : (dnes.length ? 'Teraz zatvorené' : 'Dnes neordinujeme');
      dalsieText = dalsie ? 'Najbližšie ordinujeme ' + kedy(dalsie) + '.' : '';
    }

    doc.querySelectorAll('[data-dnes]').forEach(function (box) {
      var nazov = box.querySelector('[data-dnes-nazov]');
      var casEl = box.querySelector('[data-dnes-cas]');
      var stavEl = box.querySelector('[data-dnes-stav]');
      var dalsieEl = box.querySelector('[data-dnes-dalsie]');
      if (nazov) nazov.textContent = 'Dnes, ' + DNI[t.den - 1];
      if (casEl) casEl.textContent = dnesText;
      if (stavEl) { stavEl.textContent = stavText; stavEl.classList.toggle('je-otvorene', stavOtvorene); stavEl.hidden = false; }
      if (dalsieEl) { dalsieEl.textContent = dalsieText; dalsieEl.hidden = !dalsieText; }
    });

    doc.querySelectorAll('tr[data-den], li[data-den]').forEach(function (el) {
      if (+el.getAttribute('data-den') !== t.den) return;
      el.classList.add('je-dnes');
      if (el.tagName === 'TR') {
        var th = el.querySelector('th');
        if (th && !th.querySelector('.dnes-stitok')) {
          var s = doc.createElement('span'); s.className = 'dnes-stitok'; s.textContent = 'dnes'; th.appendChild(s);
        }
      }
    });
  }

  /* --- Mapa: Google Mapy sa načítajú až po kliknutí --- */
  doc.querySelectorAll('[data-mapa]').forEach(function (box) {
    var b = box.querySelector('[data-mapa-nacitaj]');
    if (!b) return;
    b.addEventListener('click', function () {
      var f = doc.createElement('iframe');
      f.src = box.getAttribute('data-mapa');
      f.title = box.getAttribute('data-mapa-titulok') || 'Mapa';
      f.loading = 'lazy';
      f.referrerPolicy = 'no-referrer-when-downgrade';
      f.setAttribute('allowfullscreen', '');
      box.appendChild(f);
      box.classList.add('je-nacitana');
      window.dataLayer.push({ event: 'map_load' });
    });
  });

  /* --- Meranie kliknutí (telefón, e-mail, navigácia) pre Google Tag Manager --- */
  doc.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('a, button');
    if (!el) return;
    var href = el.getAttribute('href') || '';
    var udalost = el.getAttribute('data-event');
    if (!udalost) {
      if (href.indexOf('tel:') === 0) udalost = 'click_phone';
      else if (href.indexOf('mailto:') === 0) udalost = 'click_email';
    }
    if (!udalost) return;
    window.dataLayer.push({ event: udalost, click_location: el.getAttribute('data-location') || '', link_url: href });
  });

  /* --- Súhlas s cookies a Google Tag Manager (Consent Mode v2) --- */
  var gtmId = String(N.gtmId || '').trim();
  if (!/^GTM-[A-Z0-9]+$/.test(gtmId) || gtmId === 'GTM-XXXXXXX') return;

  var KLUC = 'orl-suhlas-v1';
  var ROK = 365 * 24 * 60 * 60 * 1000;
  function gtag() { window.dataLayer.push(arguments); }
  gtag('consent', 'default', {
    ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied',
    analytics_storage: 'denied', functionality_storage: 'granted', security_storage: 'granted',
    wait_for_update: 500
  });

  function citaj() {
    try {
      var s = JSON.parse(localStorage.getItem(KLUC) || 'null');
      if (s && typeof s.cas === 'number' && Date.now() - s.cas < ROK) return s;
    } catch (e) { /* nič */ }
    return null;
  }
  function uloz(s) { try { localStorage.setItem(KLUC, JSON.stringify(s)); } catch (e) { /* nič */ } }

  var gtmNacitany = false;
  function nacitajGTM() {
    if (gtmNacitany) return;
    gtmNacitany = true;
    window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    var j = doc.createElement('script');
    j.async = true;
    j.src = 'https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(gtmId);
    doc.head.appendChild(j);
  }
  function zmazMeracieCookies() {
    doc.cookie.split(';').forEach(function (c) {
      var n = c.split('=')[0].trim();
      if (!/^(_ga|_gid|_gat|_gcl|_fbp|_fbc)/.test(n)) return;
      var casti = location.hostname.split('.');
      for (var i = 0; i < casti.length - 1; i++) {
        doc.cookie = n + '=; Max-Age=0; path=/; domain=.' + casti.slice(i).join('.');
      }
      doc.cookie = n + '=; Max-Age=0; path=/';
    });
  }
  function aplikuj(s) {
    var m = s.marketing ? 'granted' : 'denied';
    gtag('consent', 'update', {
      analytics_storage: s.analytika ? 'granted' : 'denied',
      ad_storage: m, ad_user_data: m, ad_personalization: m
    });
    window.dataLayer.push({ event: 'consent_update', consent_analytics: !!s.analytika, consent_marketing: !!s.marketing });
    if (s.analytika || s.marketing) nacitajGTM();
    if (!s.analytika && !s.marketing) zmazMeracieCookies();
  }

  var lista = null;
  function vytvorListu() {
    lista = doc.createElement('section');
    lista.className = 'cookies';
    lista.setAttribute('aria-labelledby', 'cookies-nadpis');
    lista.hidden = true;
    lista.innerHTML =
      '<h2 id="cookies-nadpis">Súhlas s cookies</h2>' +
      '<p>Ak súhlasíte, použijeme cookies na meranie návštevnosti a vyhodnotenie reklamy. Bez súhlasu web používa len technicky nevyhnutné údaje. Voľbu môžete kedykoľvek zmeniť v pätičke stránky. <a href="' + koren + 'ochrana-osobnych-udajov/#cookies">Viac o cookies</a></p>' +
      '<div class="cookies__volby" hidden>' +
      '<label><input type="checkbox" name="analytika"><span>Analytické<small>Meranie návštevnosti (Google Analytics).</small></span></label>' +
      '<label><input type="checkbox" name="marketing"><span>Marketingové<small>Vyhodnotenie a prispôsobenie reklamy (Google Ads, Meta).</small></span></label>' +
      '</div>' +
      '<div class="cookies__tlacidla">' +
      '<button type="button" class="btn btn--primary" data-volba="odmietnut">Odmietnuť</button>' +
      '<button type="button" class="btn btn--primary" data-volba="prijat">Prijať všetky</button>' +
      '</div>' +
      '<button type="button" class="odkaz-tlacidlo" data-volba="nastavit">Vybrať, čo povolíte</button>';
    doc.body.appendChild(lista);
    if (location.protocol === 'file:') {
      var a = lista.querySelector('a'); try { var u = new URL(a.href); if (/\/$/.test(u.pathname)) { u.pathname += 'index.html'; a.href = u.href; } } catch (e) { /* nič */ }
    }
    var volby = lista.querySelector('.cookies__volby');
    var nastavitBtn = lista.querySelector('[data-volba="nastavit"]');
    lista.addEventListener('click', function (e) {
      var b = e.target.closest('[data-volba]');
      if (!b) return;
      var v = b.getAttribute('data-volba');
      var s;
      if (v === 'nastavit') {
        if (volby.hidden) {
          volby.hidden = false;
          nastavitBtn.textContent = 'Uložiť môj výber';
          volby.querySelector('input').focus();
          return;
        }
        s = { analytika: volby.querySelector('[name="analytika"]').checked, marketing: volby.querySelector('[name="marketing"]').checked };
      } else {
        var ano = v === 'prijat';
        s = { analytika: ano, marketing: ano };
      }
      s.cas = Date.now();
      uloz(s);
      aplikuj(s);
      lista.hidden = true;
      html.classList.remove('cookies-otvorene');
    });
  }
  function ukazListu() {
    if (!lista) vytvorListu();
    var s = citaj();
    lista.querySelector('[name="analytika"]').checked = !!(s && s.analytika);
    lista.querySelector('[name="marketing"]').checked = !!(s && s.marketing);
    lista.hidden = false;
    html.classList.add('cookies-otvorene');
  }

  var ulozene = citaj();
  if (ulozene) aplikuj(ulozene); else ukazListu();

  doc.querySelectorAll('[data-cookies-nastavenia]').forEach(function (b) {
    b.hidden = false;
    b.addEventListener('click', ukazListu);
  });
})();
