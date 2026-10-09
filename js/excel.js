// LH 3.5: Einträge aus Excel (.xlsx) oder CSV lesen. Die Bibliothek SheetJS wird erst beim Import
// nachgeladen, weil Schüler sie nie brauchen.
const SHEETJS = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';

function bibliothek() {
  if (window.XLSX) return Promise.resolve(window.XLSX);
  return new Promise((ok, fehler) => {
    const s = document.createElement('script');
    s.src = SHEETJS;
    s.onload = () => ok(window.XLSX);
    s.onerror = () => fehler(new Error('Die Excel-Bibliothek konnte nicht geladen werden (Internetverbindung prüfen)'));
    document.head.append(s);
  });
}

// Spalten: Deutsch | Englisch, bei Irregular Verbs Deutsch | Present | Past | Past Participle.
// Eine erste Zeile mit "Deutsch" gilt als Überschrift. Leere Zeilen werden übersprungen.
export async function eintraegeLesen(datei, art) {
  const XLSX = await bibliothek();
  const mappe = XLSX.read(await datei.arrayBuffer());
  const blatt = mappe.Sheets[mappe.SheetNames[0]];
  let zeilen = XLSX.utils.sheet_to_json(blatt, { header: 1, raw: false, defval: '' })
    .map(z => z.map(z => String(z).trim()));
  if (zeilen[0]?.[0]?.toLowerCase().startsWith('deutsch')) zeilen = zeilen.slice(1);
  return zeilen
    .filter(z => z[0] && z[1])
    .map(z => art === 'irregular'
      ? { deutsch: z[0], englisch: z[1], past: z[2] || null, past_participle: z[3] || null }
      : { deutsch: z[0], englisch: z[1] });
}
