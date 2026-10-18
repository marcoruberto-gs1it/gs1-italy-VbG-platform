-- ============================================================================
-- VbG Platform · dati grezzi (una riga per scansione)
-- Da eseguire nel SQL Editor di Supabase DOPO dashboard.sql. Si può rieseguire.
--
-- Sicurezza:
--  · scan_events resta chiusa (RLS senza policy): le righe si leggono solo da questa
--    funzione, che verifica l'abilitazione prima di restituire qualcosa;
--  · in scan_events non ci sono dati personali (niente IP né identificativi).
--
-- Filtri (p_filters, tutti facoltativi):
--   q           testo libero su codice, titolare, categoria, dominio del link
--   symbology   EAN-13, QR Code Standard GS1…
--   compliance  gs1 | partial | error | none | manual
--   vbg_state   verified | licensed | invalid | error | none (= non verificato)
--   link_level  trusted | unknown | danger | pending | none (= senza link)
--   source      camera | image | manual
--   licence     inactive (licenza scaduta o non attiva) | active
-- ============================================================================

create or replace function public.dashboard_events(
  p_from     timestamptz,
  p_to       timestamptz,
  p_country  text  default null,
  p_filters  jsonb default '{}'::jsonb,
  p_limit    int   default 25,
  p_offset   int   default 0
)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  q       text := nullif(trim(p_filters ->> 'q'), '');
  f_sym   text := nullif(p_filters ->> 'symbology', '');
  f_comp  text := nullif(p_filters ->> 'compliance', '');
  f_vbg   text := nullif(p_filters ->> 'vbg_state', '');
  f_link  text := nullif(p_filters ->> 'link_level', '');
  f_src   text := nullif(p_filters ->> 'source', '');
  f_lic   text := nullif(p_filters ->> 'licence', '');
  result  jsonb;
begin
  if not public.is_dashboard_user() then
    raise exception 'Utente non abilitato alla dashboard' using errcode = '42501';
  end if;

  with e as (
    select * from public.scan_events
    where created_at >= p_from and created_at < p_to
      and (p_country is null or country = p_country)
      and (f_sym  is null or symbology = f_sym)
      and (f_comp is null or compliance = f_comp)
      and (f_vbg  is null or (f_vbg = 'none' and vbg_state is null) or vbg_state = f_vbg)
      and (f_link is null or (f_link = 'none' and link_domain is null) or link_level = f_link)
      and (f_src  is null or source = f_src)
      and (f_lic  is null
        or (f_lic = 'inactive' and public.licence_inactive(vbg_licence_status, vbg_record_status))
        or (f_lic = 'active' and vbg_state in ('verified', 'licensed') and not public.licence_inactive(vbg_licence_status, vbg_record_status)))
      and (q is null
        or primary_key    ilike '%' || q || '%'
        or company_prefix ilike q || '%'
        or licensee_name  ilike '%' || q || '%'
        or gpc_brick_name ilike '%' || q || '%'
        or link_domain    ilike '%' || q || '%')
  )
  select jsonb_build_object(
    'total', (select count(*) from e),
    'rows', coalesce((
      select jsonb_agg(to_jsonb(p) order by p.created_at desc, p.id desc)
      from (
        select * from e
        order by created_at desc, id desc
        limit least(greatest(p_limit, 1), 200)
        offset greatest(p_offset, 0)
      ) p
    ), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

revoke all on function public.dashboard_events(timestamptz, timestamptz, text, jsonb, int, int) from public, anon;
grant execute on function public.dashboard_events(timestamptz, timestamptz, text, jsonb, int, int) to authenticated;
