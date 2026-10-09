# Englisch-Verbs

Private Lern-App für englische Vokabeln und Verben mit Karteikasten (Leitner-System). Anforderungen: `lastenheft/Lastenheft.md`.

## Technik
- Reines HTML/CSS/JavaScript (ES-Module) ohne Build-Schritt und ohne npm.
- Daten und Anmeldung in einem eigenen Supabase-Projekt (`englisch-verbs`, Region Frankfurt), getrennt von Pirates-Hockey.
- Veröffentlicht über GitHub Pages (Repo öffentlich). Im Repo nur der öffentliche anon/publishable-Schlüssel, nie der service_role-Schlüssel.
- Datenmodell: jeder Datensatz hat `id` (UUID), `erstelltAm`, `geaendertAm`.
- Hauptgerät ist das Handy: Oberfläche zuerst für schmale Bildschirme bauen.

## Regeln
- Oberstes Prinzip ist Einfachheit. Jede Funktion wird gegen das Lastenheft geprüft, Lastenheft-Änderungen nur nach Freigabe.
- Kommentare erklären das Warum und nennen die Lastenheft-Nummer (`LH 6.5`).
- Oberfläche auf Deutsch:
  - Umkehrbares ohne Rückfrage, nur Löschen und Ersetzen fragt.
  - Keine Erfolgsmeldungen für Sichtbares, keine erklärenden Grautexte.
  - Kein Knopf ausgegraut: Knöpfe melden, was nicht geht.
  - Rollen schalten Funktionen zusätzlich frei, sie ersetzen oder entfernen nie Funktionen der Basis.
  - Meldungen unten.
- Code- und Doku-Änderung im selben Commit.
