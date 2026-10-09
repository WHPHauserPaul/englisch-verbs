// Regeln des Karteikastens (LH 6). Reine Rechenlogik ohne Datenbank, damit Lernrunde, Kachel und
// Lehreransicht dieselben Regeln verwenden.

// LH 6.1: je Eintrag eine Karte pro Abfragerichtung.
export const RICHTUNGEN = {
  vokabeln: ['de_en', 'en_de'],
  irregular: ['de_en', 'en_de', 'formen'],
};

export function richtungName(art, richtung) {
  if (richtung === 'formen') return 'Present → Past, Past Participle';
  if (art === 'irregular') return richtung === 'de_en' ? 'Deutsch → Present' : 'Present → Deutsch';
  return richtung === 'de_en' ? 'Deutsch → Englisch' : 'Englisch → Deutsch';
}

// LH 6.4: Tage bis zur nächsten Abfrage je Fach; Fach 5 richtig beantwortet: 30 Tage.
const ABSTAND = { 1: 1, 2: 2, 3: 4, 4: 8, 5: 16 };
const GELERNT_ABSTAND = 30;

export function heute() {
  return isoDatum(new Date());
}

function isoDatum(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function inTagen(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return isoDatum(d);
}

export function datumText(iso) {
  const [j, m, t] = iso.split('-');
  return `${t}.${m}.${j}`;
}

// Alle Karten einer Liste mit dem Lernstand eines Schülers. Fehlt der Stand, liegt die Karte
// in Fach 1 und ist fällig (LH 6.3).
export function kartenBilden(liste, eintraege, staende) {
  const stand = new Map(staende.map(s => [`${s.eintrag_id}/${s.richtung}`, s]));
  return eintraege.flatMap(eintrag => RICHTUNGEN[liste.art].map(richtung => {
    const s = stand.get(`${eintrag.id}/${richtung}`);
    return { eintrag, richtung, fach: s?.fach ?? 1, faellig_am: s?.faellig_am ?? heute(), anzahl_falsch: s?.anzahl_falsch ?? 0 };
  }));
}

// LH 7.11: deutsche Bedeutungen eines Eintrags, durch Komma (oder Strichpunkt) getrennt (LH 3.3).
function bedeutungen(text) {
  return text.split(/[,;]/).map(b => b.trim().toLowerCase()).filter(Boolean);
}

// LH 7.11: andere Einträge, die alle deutschen Bedeutungen dieses Eintrags auch haben und damit
// bei Deutsch → Englisch ebenso richtig wären (z. B. „treffen“: hit und meet).
export function gleicheBedeutung(eintrag, eintraege) {
  const gesucht = bedeutungen(eintrag.deutsch);
  return eintraege.filter(e => e !== eintrag && gesucht.every(b => bedeutungen(e.deutsch).includes(b)));
}

export const istFaellig = karte => karte.faellig_am <= heute();

// LH 6.5: ✓ ein Fach weiter, ~ bleibt, ✗ zurück in Fach 1.
export function bewerten(karte, note) {
  let fach = karte.fach;
  let tage;
  if (note === 'richtig') {
    tage = fach === 5 ? GELERNT_ABSTAND : ABSTAND[fach + 1];
    fach = Math.min(fach + 1, 5);
  } else if (note === 'fast') {
    tage = ABSTAND[fach];
  } else {
    fach = 1;
    tage = ABSTAND[1];
  }
  return {
    eintrag_id: karte.eintrag.id,
    richtung: karte.richtung,
    fach,
    faellig_am: inTagen(tage),
    anzahl_falsch: karte.anzahl_falsch + (note === 'falsch' ? 1 : 0),
    zuletzt: new Date().toISOString(),
  };
}

// Anzahl Karten in Fach 1 bis 5 (Index 0 bis 4).
export function verteilung(karten) {
  const n = [0, 0, 0, 0, 0];
  for (const k of karten) n[k.fach - 1]++;
  return n;
}

// LH 7.10: wann wieder etwas fällig ist.
export function naechsteFaelligkeit(karten) {
  return karten.map(k => k.faellig_am).filter(d => d > heute()).sort()[0] ?? null;
}

export function mischen(feld) {
  const a = [...feld];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
