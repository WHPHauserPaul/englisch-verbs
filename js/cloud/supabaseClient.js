import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Supabase-Fehler als Ausnahme weiterreichen, damit die Seiten sie einheitlich als Meldung zeigen.
export function pruefen({ data, error }) {
  if (error) throw new Error(error.message);
  return data;
}
