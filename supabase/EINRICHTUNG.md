# Einrichtung (einmalig)

Alles passiert im Browser im Supabase-Dashboard (Projekt `englisch-verbs`) und auf GitHub. Kommt eine Fehlermeldung, den Text an Claude schicken.

## 1. Datenbank anlegen
1. Im Supabase-Projekt links auf **SQL Editor** klicken.
2. Oben auf **+** bzw. **New query** klicken.
3. Die Datei [`schema.sql`](schema.sql) auf GitHub öffnen, rechts oben auf **Copy raw file** (Symbol mit zwei Blättern) klicken.
4. Im SQL Editor in das leere Feld klicken und einfügen (Strg+V).
5. Rechts unten auf **Run** klicken.
6. Unten muss „Success. No rows returned" stehen.

## 2. Anmeldung einstellen
**Selbst registrieren abschalten** (Konten legt nur der Admin an, LH 2.2):
1. Links **Authentication**, dann **Sign In / Providers** (manchmal unter **Configuration**).
2. **Allow new users to sign up** ausschalten.
3. **Save changes** klicken.

**Adresse der App eintragen** (dorthin führt der Link in den E-Mails):
1. Links **Authentication**, dann **URL Configuration**.
2. **Site URL**: `https://whphauserpaul.github.io/englisch-verbs/` eintragen und **Save changes** klicken.
3. Darunter bei **Redirect URLs** auf **Add URL** klicken, dieselbe Adresse eintragen und speichern.

## 3. E-Mail-Versand einrichten
Supabase verschickt E-Mails von sich aus nur an Mitglieder des Supabase-Teams, also nicht an die Kinder. Deshalb verschickt das Gmail-Konto, das schon bei Pirates-Hockey die Benachrichtigungen schickt, auch hier die E-Mails. Dafür reicht dasselbe App-Passwort.

1. Links **Authentication**, dann **Emails** und oben der Reiter **SMTP Settings**.
2. **Enable Custom SMTP** einschalten.
3. Eintragen:
   - **Sender email**: die Gmail-Adresse
   - **Sender name**: `Englisch-Verbs`
   - **Host**: `smtp.gmail.com`
   - **Port number**: `465`
   - **Username**: die Gmail-Adresse
   - **Password**: das 16-stellige App-Passwort von Google (nicht das normale Gmail-Passwort)
4. **Save changes** klicken.

E-Mail-Text auf Deutsch (empfohlen):
1. Unter **Authentication → Emails** den Reiter **Templates** öffnen, dann **Reset Password**.
2. **Subject**: `Passwort für Englisch-Verbs festlegen`
3. **Body** (den bisherigen Text ersetzen):
   ```html
   <p>Hallo,</p>
   <p>über diesen Link legst du dein Passwort für Englisch-Verbs fest:</p>
   <p><a href="{{ .ConfirmationURL }}">Passwort festlegen</a></p>
   ```
4. **Save changes** klicken.

## 4. Funktion „Konto anlegen" einrichten
Damit der Admin in der App Konten anlegen kann (LH 2.2):
1. Links **Edge Functions**, dann **Deploy a new function**, dann **Via Editor**.
2. Den Namen **vor dem Deploy** genau auf `konto-anlegen` ändern. Nicht den vorgeschlagenen Zufallsnamen lassen.
3. Den Beispielcode komplett löschen.
4. Den Inhalt von [`functions/konto-anlegen/index.ts`](functions/konto-anlegen/index.ts) einfügen (wie in Schritt 1 über **Copy raw file**).
5. **Deploy function** klicken.

## 5. Ersten Admin anlegen (dich selbst)
1. Links **Authentication**, dann **Users**, dann rechts oben **Add user** und **Create new user**.
2. Die eigene E-Mail-Adresse eintragen und selbst ein Passwort wählen.
3. **Auto Confirm User** anhaken und **Create user** klicken.
4. Im **SQL Editor** eine neue Abfrage öffnen und den Inhalt von [`erster-admin.sql`](erster-admin.sql) einfügen.
5. Dort `DEIN NAME` durch deinen Namen und `DEINE-E-MAIL@HIER.EINTRAGEN` durch die E-Mail aus Punkt 2 ersetzen. Die Anführungszeichen bleiben stehen.
6. **Run** klicken.

## 6. App veröffentlichen (GitHub Pages)
1. Auf GitHub das Repo `englisch-verbs` öffnen.
2. Oben **Settings**, dann links **Pages**.
3. Bei **Source**: **Deploy from a branch**.
4. Bei **Branch**: `main` und Ordner `/ (root)` wählen, dann **Save** klicken.
5. 1–2 Minuten warten. Die App ist dann unter **https://whphauserpaul.github.io/englisch-verbs/** erreichbar.

## 7. Ausprobieren
1. Die Adresse öffnen und mit dem Konto aus Schritt 5 anmelden.
2. Unter **Konten** mit **Neues Konto** ein Kind anlegen. Das Kind bekommt eine E-Mail zum Festlegen seines Passworts.
3. Unter **Gruppen** eine Gruppe anlegen (z. B. „Familie") und das Kind hinzufügen.
4. Unter **Listen** eine Liste anlegen, Einträge eingeben oder aus Excel importieren und der Gruppe zuordnen.
5. Am Handy die Adresse öffnen und zum Startbildschirm hinzufügen:
   - Android (Chrome): Menü **⋮**, dann **Zum Startbildschirm hinzufügen**.
   - iPhone (Safari): **Teilen**, dann **Zum Home-Bildschirm**.
