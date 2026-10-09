# Lastenheft Englisch-Verbs (Arbeitstitel)

Fassung 5 · 09.10.2026 · Status: **freigegeben** (09.10.2026)

Änderungen: Fassung 5: Beispielsatz je Eintrag (3.8). Fassung 4: Alles üben entfällt, die Richtungswahl reicht; vor einer Schulaufgabe hilft Fortschritt zurücksetzen (5.3, 5.4, 7.9). Fassung 3: Abfragerichtung auf der Kartei wählbar (5.4). Fassung 2: mehrere richtige Verben bei Deutsch → Englisch, das Kind wählt aus (7.11).

Privates Projekt. Web-App zum Vokabel- und Verbenlernen mit Karteikasten. Später eventuell für eine Schule.

**Oberstes Prinzip: Einfachheit.** Ein Kind soll ohne Erklärung nach dem Anmelden sofort lernen können.

---

## 1. Rahmenbedingungen

1.1 Web-App im Browser, vor allem am Handy, zusätzlich am PC. Installierbar auf dem Startbildschirm (PWA). Braucht eine Internetverbindung.
1.2 Technik wie Pirates-Hockey: reines HTML/CSS/JavaScript ohne Build-Schritt, Daten in einem **eigenen** Supabase-Projekt, Code in einem **eigenen** GitHub-Repo.
1.3 Die App ist über eine feste Internetadresse erreichbar (GitHub Pages, Repo öffentlich), damit die Kinder sie von zuhause am Handy öffnen können. Im Code stehen keine Geheimnisse und keine Schülerdaten, die liegen nur in Supabase.
1.4 Bedienung auf Deutsch.
1.5 Jeder Datensatz hat `id` (UUID), `erstelltAm`, `geaendertAm`.

## 2. Konten und Rollen

2.1 Anmeldung mit E-Mail und Passwort wie bei Pirates-Hockey. Passwort vergessen per E-Mail-Link.
2.2 Konten legt nur der Admin an (Einladung per E-Mail, das Kind setzt sein Passwort selbst).
2.3 Rollen:

| Nr. | Rolle | darf |
|---|---|---|
| 2.3.1 | Schüler | zugeordnete Listen lernen, eigenen Fortschritt sehen und zurücksetzen |
| 2.3.2 | Lehrer | zusätzlich: Listen anlegen und pflegen, Listen zuordnen, Fortschritt seiner Schüler sehen |
| 2.3.3 | Admin | zusätzlich: Konten anlegen, Rollen vergeben, alles sehen |

2.4 Rollen schalten Funktionen nur zusätzlich frei. Auch Lehrer und Admin können selbst lernen.
2.5 Hinweis: Jedes Konto braucht eine eigene E-Mail-Adresse. Geschwister ohne eigene Adresse können z. B. `eltern+anna@…` nutzen, das funktioniert bei den meisten Anbietern (Gmail, Outlook, GMX).

## 3. Lernlisten

3.1 Eine Liste hat einen Namen (z. B. „Verbs Unit 1") und eine Art:
- **Vokabeln**: je Eintrag Deutsch und Englisch.
- **Irregular Verbs**: je Eintrag Deutsch, Grundform (Present), Past, Past Participle.

3.2 Die Einträge werden genau so angezeigt, wie sie eingegeben wurden (mit oder ohne „to"), damit auch Phrasen möglich sind.
3.3 Mehrere Bedeutungen stehen in einem Feld, durch Komma getrennt („bekommen, holen"). Die Lösung zeigt das ganze Feld.
3.4 Lehrer legen Listen an, benennen um, löschen sie (mit Rückfrage), und fügen Einträge hinzu, ändern oder löschen sie.
3.5 **Import aus Excel** (.xlsx oder .csv): Spalten Deutsch | Englisch, bei Irregular Verbs Deutsch | Present | Past | Past Participle, jeweils optional dahinter der Beispielsatz (3.8). Vor dem Übernehmen zeigt eine Vorschau die erkannten Einträge.
3.6 **Fotos und Scans** von Buchseiten werden außerhalb der App ausgewertet: Claude liest sie in einer Sitzung aus und liefert eine Excel-Datei für den Import (3.5). In die App kommt keine Bilderkennung, weil das laufende Kosten verursachen würde.
3.7 Ändert sich ein Eintrag, bleibt der Lernstand der Kinder zu diesem Eintrag erhalten.
3.8 Jeder Eintrag kann einen **Beispielsatz** haben (optional). Beim Excel-Import steht er in der Spalte nach den Wörtern (Vokabeln: Spalte C, Irregular Verbs: Spalte E). In der Lernrunde erscheint er klein unter der Lösung, mit 🔊, und erst nach „Lösung zeigen", weil er das englische Wort enthält. Er wird nicht bewertet.

## 4. Zuordnung

4.1 Lehrer ordnen Schüler zu **Gruppen** (z. B. „6b" oder „Familie").
4.2 Eine Liste wird einer Gruppe oder einzelnen Schülern zugeordnet. Der Schüler sieht nur die ihm zugeordneten Listen.
4.3 Wird eine Zuordnung entfernt, verschwindet die Kachel. Der Lernstand bleibt gespeichert und ist bei erneuter Zuordnung wieder da.

## 5. Startseite

5.1 Nach der Anmeldung erscheint je zugeordneter Liste eine Kachel.
5.2 Die Kachel zeigt den Namen, die Zahl der heute fälligen Karten und einen kleinen Balken mit der Verteilung auf die 5 Fächer.
5.3 Antippen der Kachel öffnet die Kartei der Liste:
- Knopf **Lernen**: alle fälligen Karten (Kapitel 7)
- Ansicht der Fächer je Abfragerichtung (6.2)
- **Fortschritt zurücksetzen**, mit Rückfrage

5.4 Auf der Kartei lässt sich die **Richtung** wählen: alle Richtungen (Standard) oder eine einzelne (z. B. nur Deutsch → Englisch). Die Wahl gilt für Lernen, die Zahl auf dem Lernen-Knopf zählt nur diese Richtung. Sie wird je Liste auf dem Gerät gemerkt. Die Kachel der Startseite zählt weiter alle Richtungen.

## 6. Karteikasten (Leitner-System)

6.1 Aus jedem Eintrag entstehen getrennte Karten, eine je Abfragerichtung:
- Vokabeln: **Deutsch → Englisch** und **Englisch → Deutsch**
- Irregular Verbs: **a) Deutsch → Present**, **b) Present → Deutsch**, **c) Present → Past + Past Participle**

6.2 Jede Richtung ist eine eigene Kartei mit 5 Fächern und wird auch getrennt angezeigt.
6.3 Neue Karten liegen in Fach 1 und sind sofort fällig.
6.4 Fälligkeit nach dem Fach: Fach 1 täglich, Fach 2 nach 2 Tagen, Fach 3 nach 4 Tagen, Fach 4 nach 8 Tagen, Fach 5 nach 16 Tagen. Eine Karte, die in Fach 5 richtig beantwortet wird, bleibt dort und ist nach 30 Tagen wieder fällig. Fach 5 gilt als „gelernt".
6.5 Gewertet wird die **erste** Antwort einer Karte in einer Lernrunde:

| Nr. | Zeichen | Bedeutung | Folge |
|---|---|---|---|
| 6.5.1 | ✓ Haken | richtiges Wort, richtig geschrieben | ein Fach weiter |
| 6.5.2 | ~ Welle | richtiges Wort, falsch geschrieben | bleibt im Fach |
| 6.5.3 | ✗ Kreuz | falsches Wort | zurück in Fach 1 |

6.6 Bei Karte c) (Past + Past Participle) gibt es **eine** Bewertung für beide Formen. Ein Haken gibt es nur, wenn beide stimmen.

## 7. Lernrunde

7.1 Die fälligen Karten aller Richtungen der Liste kommen gemischt in zufälliger Reihenfolge.
7.2 Ablauf je Karte, immer gleich:
1. Die Frage erscheint groß (z. B. „gehen" oder „go").
2. Der Schüler schreibt die Antwort auf einen Zettel und tippt auf **Lösung zeigen**.
3. Die Lösung erscheint unter der Frage.
4. Der Schüler tippt auf ✓, ~ oder ✗. Danach kommt sofort die nächste Karte.

7.3 Bei englischen Wörtern (Frage oder Lösung) gibt es einen Lautsprecher-Knopf, der das Wort vorliest (Sprachausgabe des Browsers, en-GB).
7.4 Nach ~ oder ✗ kommt die Karte in derselben Runde später noch einmal, frühestens nach 3 anderen Karten, bis sie mit ✓ beantwortet ist. Die Wiederholung ändert das Fach nicht mehr (6.5).
7.5 Die Runde endet, wenn jede Karte einmal mit ✓ beantwortet wurde oder wenn der Schüler auf **Beenden** tippt. Bereits gegebene Antworten bleiben gespeichert.
7.6 Jede Bewertung wird sofort gespeichert. Ein Abbruch durch Schließen der App verliert nichts.
7.7 Oben steht ein Zähler: „noch 12 Karten".
7.8 Am Ende eine kurze Übersicht: Anzahl ✓ / ~ / ✗ beim ersten Versuch.
7.9 entfällt (Fassung 4). Wer vor einer Schulaufgabe alle Karten wiederholen will, setzt den Fortschritt zurück (5.3).
7.10 Ist nichts fällig, meldet der Lernen-Knopf: „Heute ist nichts fällig, nächste Karten am …".
7.11 **Mehrere richtige Verben** (z. B. „treffen": hit und meet). Ein anderer Eintrag der Liste gilt bei Deutsch → Englisch ebenfalls als richtig, wenn er alle deutschen Bedeutungen der Frage auch hat. Bei „fahren" sind also drive und ride richtig, bei „reiten, fahren" nur ride.
- 7.11.1 Die Lösung zeigt alle richtigen Verben. Das Kind tippt an, welches es geschrieben hat, und bewertet dann. Für ✗ ist keine Auswahl nötig, es gilt immer für die gefragte Karte.
- 7.11.2 Die Bewertung gilt für das angetippte Verb.
- 7.11.3 War das angetippte Verb nicht das gefragte, kommt die gefragte Karte in der Runde noch einmal (frühestens nach 3 anderen Karten), mit Hinweis, z. B. „treffen (nicht hit)". Das ausgeschlossene Verb steht dann nicht mehr in der Lösung.

## 8. Lehreransicht

8.1 Tabelle je Gruppe und Liste: Schüler, Karten je Fach, zuletzt gelernt am, Anteil gelernt.
8.2 Je Schüler und Liste: die Karten mit den meisten ✗ (die „Problemwörter").
8.3 Der Lehrer kann den Fortschritt eines Schülers für eine Liste zurücksetzen (mit Rückfrage).

## 9. Später (nicht in Fassung 1)

9.1 Belohnungen (Serien, Sterne)
9.2 Weitergabe an die Schule: Datenschutz (DSGVO, Daten von Kindern, Einwilligung der Eltern, Auftragsverarbeitung mit Supabase) muss vorher geklärt werden.
9.3 Weitere Listenarten (z. B. Sätze, andere Sprachen)

## Offene Fragen

O1 **Name der App:** Arbeitstitel „Englisch-Verbs", jederzeit änderbar.
