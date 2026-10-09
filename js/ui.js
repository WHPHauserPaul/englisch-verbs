// Bausteine der Oberflaeche. Elemente werden per DOM erzeugt statt per innerHTML,
// damit Namen und Notizen nie als HTML ausgefuehrt werden.

export function el(tag, eigenschaften = {}, ...kinder) {
  const e = document.createElement(tag);
  let wert;
  for (const [k, v] of Object.entries(eigenschaften ?? {})) {
    if (v == null || v === false) continue;
    if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (k === 'class') e.className = v;
    else if (k === 'value') wert = v;
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const kind of kinder.flat(Infinity)) {
    if (kind == null || kind === false) continue;
    e.append(kind instanceof Node ? kind : String(kind));
  }
  // Bei <select> greift der Wert erst, wenn die Optionen da sind.
  if (wert !== undefined) e.value = wert;
  return e;
}

export function auswahl(optionen, wert, eigenschaften = {}) {
  return el('select', { ...eigenschaften, value: wert ?? '' },
    optionen.map(o => Array.isArray(o) ? el('option', { value: o[0] }, o[1]) : el('option', { value: o }, o)));
}

// Meldungen unten am Rand. Bei offenem Fenster muessen sie in dessen Top-Layer, sonst verdeckt.
export function meldung(text, art = 'fehler') {
  const ort = document.querySelector('dialog[open]') ?? document.body;
  let box = ort.querySelector(':scope > .meldungen');
  if (!box) {
    box = el('div', { class: 'meldungen' });
    ort.append(box);
  }
  const m = el('div', { class: `meldung ${art}`, onclick: () => m.remove() }, text);
  box.append(m);
  setTimeout(() => m.remove(), art === 'fehler' ? 7000 : 3500);
}

// Modales Fenster, das sich beim Schliessen selbst entfernt. Nicht ueber das close-Ereignis geloest:
// das kommt nicht in jeder Umgebung an, und ein liegengebliebenes Fenster verfaelscht spaetere Eingaben.
function modal(klasse, inhalt, beiZu = () => {}) {
  const d = el('dialog', { class: klasse }, inhalt);
  let zu = false;
  d.schliessen = ergebnis => {
    if (zu) return;
    zu = true;
    d.close();
    d.remove();
    beiZu(ergebnis);
  };
  d.addEventListener('cancel', ev => { ev.preventDefault(); d.schliessen(false); });
  d.addEventListener('close', () => d.schliessen(false));
  document.body.append(d);
  d.showModal();
  return d;
}

// Rueckfrage nur fuer Nicht-Umkehrbares (Loeschen, Daten ersetzen).
export function fragen(text, jaText = 'Löschen') {
  return new Promise(resolve => {
    const d = modal('frage', [
      el('p', {}, text),
      el('div', { class: 'knoepfe' },
        el('button', { class: 'gefahr', onclick: () => d.schliessen(true) }, jaText),
        el('button', { onclick: () => d.schliessen(false) }, 'Abbrechen')),
    ], resolve);
  });
}

// Rueckfrage mit mehreren Antworten (z. B. "nur diesen" / "diesen und alle folgenden").
// optionen: [[wert, beschriftung], ...]. Ergebnis ist der gewaehlte Wert oder null bei Abbruch.
export function waehlen(text, optionen) {
  return new Promise(resolve => {
    const d = modal('frage', [
      el('p', {}, text),
      el('div', { class: 'knoepfe' },
        optionen.map(([wert, beschriftung], i) => el('button', {
          class: i === 0 ? 'haupt' : '', onclick: () => d.schliessen(wert),
        }, beschriftung)),
        el('button', { onclick: () => d.schliessen(null) }, 'Abbrechen')),
    ], resolve);
  });
}

// Eingabefenster: beiSpeichern gibt false zurueck, wenn das Fenster offen bleiben soll.
export function fenster(titel, inhalt, speichernText, beiSpeichern) {
  const d = modal('fenster', el('form', {
    onsubmit: async ev => {
      ev.preventDefault();
      if (await beiSpeichern() !== false) d.schliessen(true);
    },
  },
    el('h2', {}, titel),
    inhalt,
    el('div', { class: 'knoepfe' },
      el('button', { type: 'submit', class: 'haupt' }, speichernText),
      el('button', { type: 'button', onclick: () => d.schliessen(false) }, 'Abbrechen'))));
  return d;
}

let feldNummer = 0;
// Beschriftung links, Feld rechts.
export function zeile(beschriftung, feld) {
  const id = `feld-${++feldNummer}`;
  feld.id = id;
  return [el('label', { for: id }, beschriftung), feld];
}
