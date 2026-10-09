-- Ersten Admin anlegen (LH 2.3.3). Vorher im Dashboard unter Authentication -> Users -> "Add user"
-- das eigene Konto anlegen ("Auto Confirm User" anhaken). Dann hier E-Mail und Namen anpassen und
-- im SQL Editor ausführen.

insert into profile (id, name, email, rolle)
select id, 'DEIN NAME', email, 'admin'
from auth.users
where email = 'DEINE-E-MAIL@HIER.EINTRAGEN'
on conflict (id) do update set rolle = 'admin', name = excluded.name;
