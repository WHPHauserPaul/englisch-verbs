-- Datenbank für Englisch-Verbs. Einmal komplett im Supabase SQL Editor ausführen.
-- Alle Tabellen sind per Row Level Security (RLS) geschützt: der öffentliche anon-Schlüssel in der App
-- erlaubt nur, was die Regeln unten dem angemeldeten Konto zugestehen.

create extension if not exists pgcrypto;

-- geaendert_am bei jeder Änderung nachziehen (LH 1.5)
create or replace function geaendert_setzen() returns trigger language plpgsql as $$
begin
  new.geaendert_am := now();
  return new;
end $$;

-- ---------------------------------------------------------------------------------------------
-- Tabellen
-- ---------------------------------------------------------------------------------------------

-- LH 2.3: Rolle je Konto. id ist die Konto-ID von Supabase Auth.
create table profile (
  id uuid primary key references auth.users on delete cascade,
  name text not null default '',
  email text,
  rolle text not null default 'schueler' check (rolle in ('schueler', 'lehrer', 'admin')),
  erstellt_am timestamptz not null default now(),
  geaendert_am timestamptz not null default now()
);

-- LH 3.1
create table liste (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  art text not null check (art in ('vokabeln', 'irregular')),
  erstellt_von uuid references auth.users on delete set null default auth.uid(),
  erstellt_am timestamptz not null default now(),
  geaendert_am timestamptz not null default now()
);

-- LH 3.1–3.3: bei Irregular Verbs ist "englisch" die Grundform (Present).
create table eintrag (
  id uuid primary key default gen_random_uuid(),
  liste_id uuid not null references liste on delete cascade,
  deutsch text not null,
  englisch text not null,
  past text,
  past_participle text,
  position int not null default 0,
  erstellt_am timestamptz not null default now(),
  geaendert_am timestamptz not null default now()
);
create index on eintrag (liste_id);

-- LH 4.1: Gruppe gehört dem Lehrer, der sie angelegt hat.
create table gruppe (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  lehrer_id uuid not null references auth.users on delete cascade default auth.uid(),
  erstellt_am timestamptz not null default now(),
  geaendert_am timestamptz not null default now()
);

create table gruppe_mitglied (
  id uuid primary key default gen_random_uuid(),
  gruppe_id uuid not null references gruppe on delete cascade,
  schueler_id uuid not null references auth.users on delete cascade,
  erstellt_am timestamptz not null default now(),
  geaendert_am timestamptz not null default now(),
  unique (gruppe_id, schueler_id)
);

-- LH 4.2: Liste an eine Gruppe ODER an einen einzelnen Schüler.
create table zuordnung (
  id uuid primary key default gen_random_uuid(),
  liste_id uuid not null references liste on delete cascade,
  gruppe_id uuid references gruppe on delete cascade,
  schueler_id uuid references auth.users on delete cascade,
  erstellt_am timestamptz not null default now(),
  geaendert_am timestamptz not null default now(),
  check ((gruppe_id is null) <> (schueler_id is null))
);
create unique index on zuordnung (liste_id, gruppe_id) where gruppe_id is not null;
create unique index on zuordnung (liste_id, schueler_id) where schueler_id is not null;

-- LH 6: Lernstand je Schüler, Eintrag und Abfragerichtung. Fehlt eine Zeile, liegt die Karte
-- in Fach 1 und ist fällig (LH 6.3) — so sind neue Einträge ohne weiteres Zutun sofort lernbar.
-- Die Zeile bleibt beim Entfernen einer Zuordnung erhalten (LH 4.3).
create table karte (
  id uuid primary key default gen_random_uuid(),
  schueler_id uuid not null references auth.users on delete cascade default auth.uid(),
  eintrag_id uuid not null references eintrag on delete cascade,
  richtung text not null check (richtung in ('de_en', 'en_de', 'formen')),
  fach int not null default 1 check (fach between 1 and 5),
  faellig_am date not null default current_date,
  anzahl_falsch int not null default 0,
  zuletzt timestamptz,
  erstellt_am timestamptz not null default now(),
  geaendert_am timestamptz not null default now(),
  unique (schueler_id, eintrag_id, richtung)
);
create index on karte (eintrag_id);

create trigger geaendert before update on profile for each row execute function geaendert_setzen();
create trigger geaendert before update on liste for each row execute function geaendert_setzen();
create trigger geaendert before update on eintrag for each row execute function geaendert_setzen();
create trigger geaendert before update on gruppe for each row execute function geaendert_setzen();
create trigger geaendert before update on karte for each row execute function geaendert_setzen();

-- ---------------------------------------------------------------------------------------------
-- Hilfsfunktionen für die Zugriffsregeln. "security definer", damit sie selbst nicht wieder an
-- den Regeln der Tabellen hängen bleiben (sonst endlose Rekursion bei profile).
-- ---------------------------------------------------------------------------------------------

create or replace function meine_rolle() returns text language sql stable security definer set search_path = public as $$
  select rolle from profile where id = auth.uid()
$$;

create or replace function ist_lehrer() returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(meine_rolle() in ('lehrer', 'admin'), false)
$$;

create or replace function ist_admin() returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(meine_rolle() = 'admin', false)
$$;

-- LH 2.3.2: Lehrer sehen den Fortschritt der Schüler in ihren Gruppen, der Admin alle.
create or replace function ist_mein_schueler(schueler uuid) returns boolean language sql stable security definer set search_path = public as $$
  select ist_admin() or exists (
    select 1 from gruppe_mitglied m join gruppe g on g.id = m.gruppe_id
    where m.schueler_id = schueler and g.lehrer_id = auth.uid())
$$;

-- LH 4.2: direkt oder über eine Gruppe zugeordnet.
create or replace function ist_zugeordnet(liste uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from zuordnung z
    where z.liste_id = liste and (
      z.schueler_id = auth.uid() or
      z.gruppe_id in (select gruppe_id from gruppe_mitglied where schueler_id = auth.uid())))
$$;

-- LH 5.1: die Kacheln der Startseite — nur zugeordnete Listen, auch für Lehrer und Admin,
-- die sonst alle Listen lesen dürfen.
create or replace function meine_listen() returns setof liste language sql stable security definer set search_path = public as $$
  select * from liste where ist_zugeordnet(id) order by name
$$;

-- LH 2.3.3: Rolle setzt nur der Admin. Eigene Rolle ändern geht nicht über die Tabelle (siehe Rechte unten).
create or replace function rolle_setzen(konto uuid, neue_rolle text) returns void language plpgsql security definer set search_path = public as $$
begin
  if not ist_admin() then raise exception 'Nur der Admin darf Rollen vergeben'; end if;
  if konto = auth.uid() and neue_rolle <> 'admin' then raise exception 'Die eigene Admin-Rolle kann man nicht abgeben'; end if;
  update profile set rolle = neue_rolle where id = konto;
end $$;

-- ---------------------------------------------------------------------------------------------
-- Zugriffsregeln
-- ---------------------------------------------------------------------------------------------

alter table profile enable row level security;
alter table liste enable row level security;
alter table eintrag enable row level security;
alter table gruppe enable row level security;
alter table gruppe_mitglied enable row level security;
alter table zuordnung enable row level security;
alter table karte enable row level security;

-- profile: jeder sieht sich selbst, Lehrer sehen alle (zum Zuordnen). Ändern lässt sich nur der
-- Name; die Rolle nur über rolle_setzen(). Angelegt werden Profile von der Funktion konto-anlegen.
create policy lesen on profile for select using (id = auth.uid() or ist_lehrer());
create policy aendern on profile for update using (id = auth.uid() or ist_admin());
revoke all on profile from authenticated, anon;
grant select on profile to authenticated;
grant update (name) on profile to authenticated;

-- Listen und Einträge: Lehrer pflegen alle Listen gemeinsam, Schüler lesen die zugeordneten.
create policy lesen on liste for select using (ist_lehrer() or ist_zugeordnet(id));
create policy schreiben on liste for all using (ist_lehrer()) with check (ist_lehrer());

create policy lesen on eintrag for select using (ist_lehrer() or ist_zugeordnet(liste_id));
create policy schreiben on eintrag for all using (ist_lehrer()) with check (ist_lehrer());

-- Gruppen: jeder Lehrer seine eigenen, der Admin alle.
create policy eigene on gruppe for all
  using (lehrer_id = auth.uid() or ist_admin())
  with check (ist_lehrer() and (lehrer_id = auth.uid() or ist_admin()));

create policy eigene on gruppe_mitglied for all
  using (exists (select 1 from gruppe g where g.id = gruppe_id and (g.lehrer_id = auth.uid() or ist_admin())))
  with check (exists (select 1 from gruppe g where g.id = gruppe_id and (g.lehrer_id = auth.uid() or ist_admin())));

create policy lehrer on zuordnung for all using (ist_lehrer()) with check (ist_lehrer());

-- Lernstand: der Schüler schreibt seinen eigenen; Lehrer sehen und löschen (zurücksetzen, LH 8.3)
-- den ihrer Schüler.
create policy eigene on karte for all using (schueler_id = auth.uid()) with check (schueler_id = auth.uid());
create policy lehrer_lesen on karte for select using (ist_mein_schueler(schueler_id));
create policy lehrer_loeschen on karte for delete using (ist_mein_schueler(schueler_id));

-- Rechte ausdrücklich vergeben, falls das Projekt neue Tabellen nicht von selbst für die App freigibt.
-- Was davon tatsächlich erlaubt ist, entscheiden die Regeln oben.
grant usage on schema public to authenticated;
grant select, insert, update, delete on liste, eintrag, gruppe, gruppe_mitglied, zuordnung, karte to authenticated;
grant execute on function meine_listen(), rolle_setzen(uuid, text) to authenticated;
