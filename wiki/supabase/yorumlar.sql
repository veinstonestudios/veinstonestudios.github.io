-- ============================================================================
-- THE FACILITY WIKI — YORUM SİSTEMİ (Supabase / PostgreSQL)
--
-- Kurulum: Supabase projesinde  SQL Editor → New query  aç, bu dosyanın
-- tamamını yapıştır, en alttaki EKİP KODUNU değiştir ve "Run" de.
--
-- Güvenlik:
--   * Tablolara tarayıcıdan doğrudan erişim kapalıdır (RLS açık, politika yok).
--   * Wiki yalnızca iki fonksiyonu çağırabilir: wiki_list_comments ve
--     wiki_add_comment. İkisi de ekip kodunu kontrol eder; kodu bilmeyen
--     kimse yorumları okuyamaz veya yazamaz.
--   * Yorumlar wiki üzerinden düzenlenemez veya silinemez. Silme, düzenleme
--     ve öneri durumunu değiştirme Supabase panelinden (Table Editor) yapılır.
--   * Bu dosyada gizli bilgi yoktur; ekip kodu yalnızca veritabanında durur.
-- ============================================================================

create extension if not exists pgcrypto;

-- Yorumlar ------------------------------------------------------------------
create table if not exists public.wiki_comments (
  id          uuid primary key default gen_random_uuid(),
  page        text not null check (char_length(page) between 1 and 200),      -- wiki sayfa başlığı
  section     text not null default '' check (char_length(section) <= 200), -- '' = sayfanın geneli, aksi hâlde bölüm/kutu anahtarı
  parent_id   uuid references public.wiki_comments(id) on delete cascade,     -- cevaplar için
  author      text not null check (char_length(btrim(author)) between 1 and 60),
  kind        text not null default 'yorum' check (kind in ('yorum', 'oneri', 'soru', 'tartisma')),
  body        text not null check (char_length(btrim(body)) between 1 and 4000),
  status      text not null default 'degerlendirilecek'
              check (status in ('degerlendirilecek', 'kabul', 'red', 'beklemede')),     -- yalnızca öneriler için anlamlı
  created_at  timestamptz not null default now()
);
create index if not exists wiki_comments_page_idx on public.wiki_comments (page, created_at);
create index if not exists wiki_comments_created_idx on public.wiki_comments (created_at desc);

-- Ayarlar (ekip kodu) --------------------------------------------------------
create table if not exists public.wiki_settings (
  key   text primary key,
  value text not null
);

-- Doğrudan erişimi kapat
alter table public.wiki_comments enable row level security;
alter table public.wiki_settings enable row level security;
revoke all on public.wiki_comments from anon, authenticated;
revoke all on public.wiki_settings from anon, authenticated;

-- Ekip kodu kontrolü (yalnızca diğer fonksiyonların içinden kullanılır) ------
create or replace function public.wiki_check_code(p_code text)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from wiki_settings where key = 'team_code' and value = coalesce(p_code, ''));
$$;

-- Yorumları listele -----------------------------------------------------------
-- p_page boşsa tüm sayfaların en yeni yorumlarını döndürür.
create or replace function public.wiki_list_comments(p_code text, p_page text default null, p_limit int default 500)
returns setof public.wiki_comments
language plpgsql stable security definer set search_path = public
as $$
begin
  if not wiki_check_code(p_code) then
    raise exception 'invalid_code';
  end if;
  return query
    select * from wiki_comments
    where p_page is null or page = p_page
    order by created_at desc
    limit least(greatest(coalesce(p_limit, 500), 1), 1000);
end;
$$;

-- Yorum ekle ------------------------------------------------------------------
create or replace function public.wiki_add_comment(
  p_code text, p_page text, p_section text, p_parent uuid,
  p_author text, p_kind text, p_body text)
returns public.wiki_comments
language plpgsql volatile security definer set search_path = public
as $$
declare
  r        wiki_comments;
  v_parent uuid := null;
  v_page   text := btrim(coalesce(p_page, ''));
  v_sect   text := btrim(coalesce(p_section, ''));
  v_kind   text := coalesce(nullif(p_kind, ''), 'yorum');
begin
  if not wiki_check_code(p_code) then
    raise exception 'invalid_code';
  end if;

  -- Basit kötüye kullanım sınırı: tüm wiki için dakikada en fazla 30 yorum
  if (select count(*) from wiki_comments where created_at > now() - interval '1 minute') >= 30 then
    raise exception 'rate_limited';
  end if;

  -- Cevaplar tek seviyelidir: bir cevaba verilen cevap, ana yoruma bağlanır
  if p_parent is not null then
    select coalesce(c.parent_id, c.id), c.page, c.section
      into v_parent, v_page, v_sect
      from wiki_comments c where c.id = p_parent;
    if v_parent is null then
      raise exception 'parent_not_found';
    end if;
    v_kind := 'yorum';
  end if;

  insert into wiki_comments (page, section, parent_id, author, kind, body)
  values (v_page, v_sect, v_parent, btrim(p_author), v_kind, btrim(p_body))
  returning * into r;
  return r;
end;
$$;

-- Fonksiyon izinleri: yalnızca listeleme ve ekleme dışarıya açık
revoke execute on function public.wiki_check_code(text) from public, anon, authenticated;
revoke execute on function public.wiki_list_comments(text, text, int) from public;
revoke execute on function public.wiki_add_comment(text, text, text, uuid, text, text, text) from public;
grant  execute on function public.wiki_list_comments(text, text, int) to anon, authenticated;
grant  execute on function public.wiki_add_comment(text, text, text, uuid, text, text, text) to anon, authenticated;

-- ============================================================================
-- EKİP KODU — aşağıdaki metni kendi kodunla değiştir ve ekiple paylaş.
-- Kodu daha sonra değiştirmek için bu satırı yeni kodla tekrar çalıştırman yeterli.
-- ============================================================================
insert into public.wiki_settings (key, value)
values ('team_code', 'BURAYA-EKIP-KODUNU-YAZ')
on conflict (key) do update set value = excluded.value;
