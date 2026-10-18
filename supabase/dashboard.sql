-- ============================================================================
-- VbG Platform · accesso alla dashboard e dati aggregati
-- Da eseguire nel SQL Editor di Supabase DOPO lo schema dell'app (scan_events).
-- Si può rieseguire.
--
-- Sicurezza:
--  · si accede con Supabase Auth (link via email) e solo se l'email è in dashboard_users;
--  · la dashboard non legge mai le singole righe di scan_events: riceve solo aggregati
--    dalla funzione dashboard_data, che verifica l'autorizzazione prima di calcolarli.
-- ============================================================================

-- Colonne di scan_events aggiunte dopo la prima versione ----------------------
alter table public.scan_events add column if not exists brand_name text;

-- Utenti abilitati -----------------------------------------------------------
create table if not exists public.dashboard_users (
  email       text primary key check (email = lower(email)),
  role        text not null default 'analyst' check (role in ('admin', 'analyst')),
  created_at  timestamptz not null default now()
);

alter table public.dashboard_users enable row level security;
revoke all on public.dashboard_users from anon, authenticated;
grant select on public.dashboard_users to authenticated;

drop policy if exists "Ognuno vede solo la propria abilitazione" on public.dashboard_users;
create policy "Ognuno vede solo la propria abilitazione" on public.dashboard_users
  for select to authenticated
  using (email = lower(auth.jwt() ->> 'email'));

create or replace function public.is_dashboard_user()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.dashboard_users where email = lower(auth.jwt() ->> 'email'))
$$;

revoke all on function public.is_dashboard_user() from public, anon;
grant execute on function public.is_dashboard_user() to authenticated;

-- Dati della dashboard -------------------------------------------------------
create or replace function public.dashboard_data(p_from timestamptz, p_to timestamptz, p_country text default null)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  result jsonb;
begin
  if not public.is_dashboard_user() then
    raise exception 'Utente non abilitato alla dashboard' using errcode = '42501';
  end if;

  with e as (
    select * from public.scan_events
    where created_at >= p_from and created_at < p_to
      and (p_country is null or country = p_country)
  )
  select jsonb_build_object(
    'kpi', (
      select jsonb_build_object(
        'letture',            count(*),
        'letture_simbolo',    count(*) filter (where source <> 'manual'),
        'letture_2d',         count(*) filter (where is_2d),
        'conformi',           count(*) filter (where compliance = 'gs1'),
        'con_errori',         count(*) filter (where compliance in ('error', 'partial')),
        'non_gs1',            count(*) filter (where compliance = 'none'),
        'prodotti_distinti',  count(distinct primary_key) filter (where primary_ai = '01'),
        'verificati',         count(*) filter (where vbg_state = 'verified'),
        'schede_valutate',    count(*) filter (where vbg_core_count is not null),
        'schede_complete',    count(*) filter (where vbg_core_count = 7),
        'allerte_link',       count(*) filter (where vbg_state = 'verified' and link_level in ('unknown', 'danger')),
        'link_sospetti',      count(*) filter (where link_level = 'danger')
      ) from e
    ),
    'giornaliero', (
      select coalesce(jsonb_agg(d order by d.giorno), '[]'::jsonb) from (
        select date_trunc('day', created_at)::date            as giorno,
               count(*) filter (where is_2d)                   as letture_2d,
               count(*) filter (where is_2d = false)           as letture_1d,
               count(*) filter (where source = 'manual')       as manuali
        from e group by 1
      ) d
    ),
    'regioni', (
      select coalesce(jsonb_agg(r order by r.letture desc), '[]'::jsonb) from (
        select country, region_code, max(region) as region,
               count(*)                                  as letture,
               count(*) filter (where is_2d)             as letture_2d,
               count(*) filter (where compliance = 'gs1') as conformi
        from e group by country, region_code
        order by count(*) desc limit 40
      ) r
    ),
    'simbologie', (
      select coalesce(jsonb_agg(s order by s.letture desc), '[]'::jsonb) from (
        select coalesce(symbology, 'Inserito a mano') as simbologia, bool_or(is_2d) as is_2d, count(*) as letture
        from e group by 1
      ) s
    ),
    'conformita', (
      select coalesce(jsonb_object_agg(compliance, n), '{}'::jsonb) from (
        select coalesce(compliance, 'none') as compliance, count(*) as n from e group by 1
      ) c
    ),
    'categorie', (
      select coalesce(jsonb_agg(c order by c.letture desc), '[]'::jsonb) from (
        select gpc_brick, max(gpc_brick_name) as categoria, max(gpc_segment) as segmento,
               count(*)                                                  as letture,
               count(distinct primary_key)                               as gtin_distinti,
               round(avg(vbg_core_count), 1)                             as media_dati,
               count(*) filter (where vbg_core_count = 7)                as schede_complete,
               count(*) filter (where is_2d)                             as letture_2d
        from e where gpc_brick is not null
        group by gpc_brick order by count(*) desc limit 15
      ) c
    ),
    'brand', (
      select coalesce(jsonb_agg(b order by b.letture desc), '[]'::jsonb) from (
        select brand_name as brand, max(licensee_name) as titolare,
               count(*)                                      as letture,
               count(distinct primary_key)                   as prodotti,
               round(avg(vbg_core_count), 1)                 as media_dati,
               count(*) filter (where vbg_core_count = 7)    as schede_complete,
               count(*) filter (where is_2d)                 as letture_2d
        from e where brand_name is not null
        group by brand_name order by count(*) desc limit 20
      ) b
    ),
    'qualita', (
      select coalesce(jsonb_agg(q order by q.errori desc, q.letture desc), '[]'::jsonb) from (
        select company_prefix, max(licensee_name) as titolare,
               count(*)                                                       as letture,
               count(*) filter (where check_digit_ok = false)                 as errori_cifra,
               count(*) filter (where syntax_ok = false)                      as errori_sintassi,
               count(*) filter (where compliance = 'partial')                 as non_standard,
               count(*) filter (where compliance in ('error', 'partial'))     as errori,
               -- Motivi degli errori: tipo, simbologia, messaggio della GS1 Barcode Syntax Engine, un esempio.
               (select coalesce(jsonb_agg(m order by m.letture desc), '[]'::jsonb) from (
                  select case when x.check_digit_ok = false then 'cifra'
                              when x.syntax_ok = false then 'sintassi'
                              else 'non_standard' end      as tipo,
                         x.symbology                        as simbologia,
                         x.syntax_error                     as errore,
                         count(*)                           as letture,
                         max(x.primary_key)                 as esempio
                  from e as x
                  where x.company_prefix = e.company_prefix and x.source <> 'manual'
                    and x.compliance in ('error', 'partial')
                  group by 1, 2, 3 order by 4 desc limit 6
               ) m)                                                           as motivi
        from e where source <> 'manual' and company_prefix is not null
        group by company_prefix
        having count(*) filter (where compliance in ('error', 'partial')) > 0
        order by 7 desc limit 20
      ) q
    ),
    'errori_sintassi', (
      select coalesce(jsonb_agg(x order by x.letture desc), '[]'::jsonb) from (
        select syntax_error as errore, count(*) as letture
        from e where syntax_error is not null
        group by 1 order by 2 desc limit 10
      ) x
    ),
    'allerte', (
      select coalesce(jsonb_agg(a order by a.sospetto desc, a.ultima desc), '[]'::jsonb) from (
        select company_prefix, max(licensee_name) as titolare, primary_key as gtin, link_domain as dominio,
               max(link_imitates)                         as somiglia_a,
               bool_or(link_level = 'danger')             as sospetto,
               bool_or(cardinality(link_threats) > 0)     as segnalato_google,
               count(*)                                   as letture,
               max(created_at)                            as ultima,
               array_agg(distinct region_code) filter (where region_code is not null) as regioni
        from e
        where vbg_state = 'verified' and link_domain is not null and link_level in ('unknown', 'danger')
        group by company_prefix, primary_key, link_domain
        limit 50
      ) a
    ),
    'non_assegnati', (
      select coalesce(jsonb_agg(n order by n.letture desc), '[]'::jsonb) from (
        select left(primary_key, 8) as inizio_codice, count(*) as letture, count(distinct primary_key) as codici,
               max(created_at) as ultima
        from e where vbg_error_code = 'E039'
        group by 1 order by 2 desc limit 20
      ) n
    ),
    'domini', (
      select coalesce(jsonb_agg(d order by d.letture desc), '[]'::jsonb) from (
        select link_domain as dominio, count(*) as letture,
               count(*) filter (where link_level = 'trusted') as verificati,
               count(*) filter (where link_level = 'danger')  as sospetti
        from e where link_domain is not null
        group by 1 order by 2 desc limit 15
      ) d
    )
  ) into result;

  return result;
end;
$$;

revoke all on function public.dashboard_data(timestamptz, timestamptz, text) from public, anon;
grant execute on function public.dashboard_data(timestamptz, timestamptz, text) to authenticated;
