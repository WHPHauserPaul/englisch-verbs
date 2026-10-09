-- LH 3.8: Beispielsatz je Eintrag (optional). Einmal im Supabase SQL Editor ausführen.
alter table eintrag add column if not exists beispiel text;

-- Damit die App die neue Spalte sofort kennt, ohne auf den nächsten Neustart der Schnittstelle zu warten.
notify pgrst, 'reload schema';
