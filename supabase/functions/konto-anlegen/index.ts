// Konto anlegen (LH 2.2): nur der Admin. Läuft als Supabase Edge Function, weil dafür der
// service_role-Schlüssel nötig ist, der nie im Browser stehen darf. SUPABASE_URL, SUPABASE_ANON_KEY
// und SUPABASE_SERVICE_ROLE_KEY stehen jeder Edge Function automatisch zur Verfügung.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const URL_ = Deno.env.get('SUPABASE_URL')!;
  const ANON = Deno.env.get('SUPABASE_ANON_KEY')!;
  const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  try {
    const { email, name, rolle, ziel } = await req.json();
    if (!email || !name) return json({ error: 'E-Mail und Name sind nötig' }, 400);
    if (!['schueler', 'lehrer', 'admin'].includes(rolle)) return json({ error: 'Unbekannte Rolle' }, 400);

    // Wer ruft auf? Mit dem Login des Aufrufers, damit dessen Rechte gelten.
    const alsAufrufer = createClient(URL_, ANON, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    });
    const { data: { user } } = await alsAufrufer.auth.getUser();
    if (!user) return json({ error: 'Nicht angemeldet' }, 401);
    const { data: profil } = await alsAufrufer.from('profile').select('rolle').eq('id', user.id).maybeSingle();
    if (profil?.rolle !== 'admin') return json({ error: 'Nur der Admin darf Konten anlegen' }, 403);

    // Zufälliges Startpasswort, das niemand kennt: das Kind legt sein Passwort über den Link
    // in der E-Mail selbst fest (LH 2.2).
    const admin = createClient(URL_, SERVICE);
    const { data: neu, error: anlegenFehler } = await admin.auth.admin.createUser({
      email, email_confirm: true, password: crypto.randomUUID(),
    });
    if (anlegenFehler) {
      const schonDa = /already|registered|exists/i.test(anlegenFehler.message);
      return json({ error: schonDa ? 'Zu dieser E-Mail-Adresse gibt es schon ein Konto' : anlegenFehler.message }, 400);
    }

    const { error: profilFehler } = await admin.from('profile').upsert({ id: neu.user.id, name, email, rolle });
    if (profilFehler) return json({ error: profilFehler.message }, 400);

    const { error: mailFehler } = await admin.auth.resetPasswordForEmail(email, ziel ? { redirectTo: ziel } : undefined);
    if (mailFehler) return json({ error: `Konto angelegt, aber die E-Mail ging nicht raus: ${mailFehler.message}` }, 400);
    return json({ ok: true });
  } catch (fehler) {
    return json({ error: String(fehler) }, 500);
  }
});
