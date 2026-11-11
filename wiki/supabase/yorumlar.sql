-- ============================================================================
-- THE FACILITY WIKI — YORUM SİSTEMİ (Supabase / PostgreSQL)
--
-- Kurulum: Supabase projesinde  SQL Editor → New query  aç, bu dosyanın
-- tamamını yapıştır, en alttaki İKİ KODU değiştir ve "Run" de.
-- Dosya tekrar çalıştırılabilir; mevcut yorumlar silinmez.
--
-- Güvenlik modeli:
--   * Tablolara tarayıcıdan doğrudan erişim kapalıdır (RLS açık, politika yok).
--     Wiki yalnızca aşağıdaki "wiki_" fonksiyonlarını çağırabilir.
--   * EKİP KODU: yorumları okumak ve yazmak için gerekir.
--   * YÖNETİCİ KODU: her yorumu düzenleyebilir/silebilir ve öneri durumunu
--     değiştirebilir. Ekip koduyla aynı olmamalıdır.
--   * Her yorum gönderildiğinde yazana gizli bir "düzenleme anahtarı" verilir
--     (veritabanında yalnızca SHA-256 özeti saklanır). Bir kullanıcı yalnızca
--     anahtarı kendi tarayıcısında bulunan yorumları düzenleyebilir/silebilir.
--   * Silinen yorumlar "silindi" olarak işaretlenir; başkalarının ona yazdığı
--     cevaplar korunur.
--   * Kötüye kullanım sınırları: wiki genelinde dakikada 30, aynı isimle
--     dakikada 6 yorum; aynı metin 10 dakika içinde aynı başlığa tekrar
--     gönderilemez; uzunluk sınırları veritabanında zorunludur.
--   * Yorum metni düz metin olarak saklanır; wiki onu HTML olarak değil,
--     kaçışlı metin olarak gösterir (script/HTML enjeksiyonu çalışmaz).
-- ============================================================================

create extension if not exists pgcrypto with schema extensions;

-- Yorumlar ------------------------------------------------------------------
create table if not exists public.wiki_comments (
  id          uuid primary key default gen_random_uuid(),
  page        text not null check (char_length(page) between 1 and 200),
  section     text not null default '' check (char_length(section) <= 200),   -- başlık anahtarı; '' = sayfanın geneli
  parent_id   uuid references public.wiki_comments(id) on delete cascade,
  author      text not null check (char_length(btrim(author)) between 1 and 60),
  kind        text not null default 'yorum' check (kind in ('yorum', 'oneri', 'soru', 'tartisma')),
  body        text not null check (char_length(body) <= 4000),
  status      text not null default 'degerlendirilecek'
              check (status in ('degerlendirilecek', 'kabul', 'red', 'beklemede')),
  created_at  timestamptz not null default now()
);
alter table public.wiki_comments add column if not exists edit_hash  text;
alter table public.wiki_comments add column if not exists edited_at  timestamptz;
alter table public.wiki_comments add column if not exists deleted    boolean not null default false;
create index if not exists wiki_comments_page_idx    on public.wiki_comments (page, created_at);
create index if not exists wiki_comments_created_idx on public.wiki_comments (created_at desc);
create index if not exists wiki_comments_author_idx  on public.wiki_comments (lower(author), created_at desc);

-- Ayarlar (ekip ve yönetici kodları) ------------------------------------------
create table if not exists public.wiki_settings (
  key   text primary key,
  value text not null
);

alter table public.wiki_comments enable row level security;
alter table public.wiki_settings enable row level security;
revoke all on public.wiki_comments from anon, authenticated;
revoke all on public.wiki_settings from anon, authenticated;

-- Eski sürümlerin fonksiyonlarını kaldır (dönüş tipleri değişti)
drop function if exists public.wiki_list_comments(text, text, int);
drop function if exists public.wiki_add_comment(text, text, text, uuid, text, text, text);

-- Yardımcılar (dışarıya kapalı) -------------------------------------------------
create or replace function public.wiki_check_code(p_code text)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from wiki_settings where key = 'team_code' and value = coalesce(p_code, '')); $$;

create or replace function public.wiki_check_admin(p_admin text)
returns boolean language sql stable security definer set search_path = public
as $$ select coalesce(p_admin, '') <> '' and exists (select 1 from wiki_settings where key = 'admin_code' and value = p_admin); $$;

create or replace function public.wiki_hash(p_token text)
returns text language sql immutable set search_path = public, extensions
as $$ select encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex'); $$;

-- Yorumları listele -------------------------------------------------------------
-- p_page boşsa tüm sayfaların en yeni yorumlarını döndürür.
create or replace function public.wiki_list_comments(p_code text, p_page text default null, p_limit int default 1000)
returns table (id uuid, page text, section text, parent_id uuid, author text, kind text, body text,
               status text, created_at timestamptz, edited_at timestamptz, deleted boolean)
language plpgsql stable security definer set search_path = public
as $$
#variable_conflict use_column
begin
  if not wiki_check_code(p_code) then raise exception 'invalid_code'; end if;
  return query
    select c.id, c.page, c.section, c.parent_id,
           case when c.deleted then '' else c.author end,
           c.kind,
           case when c.deleted then '' else c.body end,
           c.status, c.created_at, c.edited_at, c.deleted
    from wiki_comments c
    where (p_page is null or c.page = p_page)
      and (not c.deleted or exists (select 1 from wiki_comments r where r.parent_id = c.id and not r.deleted))
    order by c.created_at desc
    limit least(greatest(coalesce(p_limit, 1000), 1), 2000);
end;
$$;

-- Yorum ekle ----------------------------------------------------------------------
-- Dönen edit_token yalnızca bir kez verilir; tarayıcı onu saklar.
create or replace function public.wiki_add_comment(
  p_code text, p_page text, p_section text, p_parent uuid,
  p_author text, p_kind text, p_body text)
returns table (id uuid, page text, section text, parent_id uuid, author text, kind text, body text,
               status text, created_at timestamptz, edited_at timestamptz, deleted boolean, edit_token text)
language plpgsql volatile security definer set search_path = public, extensions
as $$
#variable_conflict use_column
declare
  v_parent uuid := null;
  v_page   text := btrim(coalesce(p_page, ''));
  v_sect   text := btrim(coalesce(p_section, ''));
  v_kind   text := coalesce(nullif(p_kind, ''), 'yorum');
  v_author text := btrim(coalesce(p_author, ''));
  v_body   text := btrim(coalesce(p_body, ''));
  v_token  text := encode(extensions.gen_random_bytes(24), 'hex');
  v_id     uuid;
begin
  if not wiki_check_code(p_code) then raise exception 'invalid_code'; end if;
  if char_length(v_body) = 0 or char_length(v_author) = 0 then raise exception 'empty'; end if;

  if (select count(*) from wiki_comments c where c.created_at > now() - interval '1 minute') >= 30
     or (select count(*) from wiki_comments c where lower(c.author) = lower(v_author)
           and c.created_at > now() - interval '1 minute') >= 6 then
    raise exception 'rate_limited';
  end if;

  if p_parent is not null then
    select coalesce(c.parent_id, c.id), c.page, c.section into v_parent, v_page, v_sect
      from wiki_comments c where c.id = p_parent and not c.deleted;
    if v_parent is null then raise exception 'parent_not_found'; end if;
    v_kind := 'yorum';
  end if;

  if exists (select 1 from wiki_comments c where c.page = v_page and c.section = v_sect and c.body = v_body
               and c.created_at > now() - interval '10 minutes') then
    raise exception 'duplicate';
  end if;

  insert into wiki_comments (page, section, parent_id, author, kind, body, edit_hash)
  values (v_page, v_sect, v_parent, v_author, v_kind, v_body, wiki_hash(v_token))
  returning wiki_comments.id into v_id;

  return query
    select c.id, c.page, c.section, c.parent_id, c.author, c.kind, c.body, c.status,
           c.created_at, c.edited_at, c.deleted, v_token
    from wiki_comments c where c.id = v_id;
end;
$$;

-- Yorum düzenle (yazarı veya yönetici) ---------------------------------------------
create or replace function public.wiki_edit_comment(p_code text, p_id uuid, p_token text, p_admin text, p_body text)
returns void language plpgsql volatile security definer set search_path = public, extensions
as $$
declare v_body text := btrim(coalesce(p_body, ''));
begin
  if not wiki_check_code(p_code) then raise exception 'invalid_code'; end if;
  if char_length(v_body) = 0 then raise exception 'empty'; end if;
  update wiki_comments c set body = v_body, edited_at = now()
   where c.id = p_id and not c.deleted
     and (wiki_check_admin(p_admin) or c.edit_hash = wiki_hash(p_token));
  if not found then raise exception 'forbidden'; end if;
end;
$$;

-- Yorum sil (yazarı veya yönetici) -------------------------------------------------
create or replace function public.wiki_delete_comment(p_code text, p_id uuid, p_token text, p_admin text)
returns void language plpgsql volatile security definer set search_path = public, extensions
as $$
begin
  if not wiki_check_code(p_code) then raise exception 'invalid_code'; end if;
  update wiki_comments c set deleted = true, body = '', edited_at = now()
   where c.id = p_id and not c.deleted
     and (wiki_check_admin(p_admin) or c.edit_hash = wiki_hash(p_token));
  if not found then raise exception 'forbidden'; end if;
end;
$$;

-- Öneri durumu (yalnızca yönetici) ------------------------------------------------
create or replace function public.wiki_set_status(p_code text, p_admin text, p_id uuid, p_status text)
returns void language plpgsql volatile security definer set search_path = public
as $$
begin
  if not wiki_check_code(p_code) then raise exception 'invalid_code'; end if;
  if not wiki_check_admin(p_admin) then raise exception 'forbidden'; end if;
  update wiki_comments c set status = p_status where c.id = p_id;
  if not found then raise exception 'not_found'; end if;
end;
$$;

-- Yönetici girişi kontrolü ---------------------------------------------------------
create or replace function public.wiki_is_admin(p_code text, p_admin text)
returns boolean language plpgsql stable security definer set search_path = public
as $$
begin
  if not wiki_check_code(p_code) then raise exception 'invalid_code'; end if;
  return wiki_check_admin(p_admin);
end;
$$;

-- İzinler: yalnızca wiki'nin kullandığı fonksiyonlar dışarıya açık ----------------
revoke execute on function public.wiki_check_code(text)  from public, anon, authenticated;
revoke execute on function public.wiki_check_admin(text) from public, anon, authenticated;
revoke execute on function public.wiki_hash(text)        from public, anon, authenticated;
revoke execute on function public.wiki_list_comments(text, text, int) from public;
revoke execute on function public.wiki_add_comment(text, text, text, uuid, text, text, text) from public;
revoke execute on function public.wiki_edit_comment(text, uuid, text, text, text) from public;
revoke execute on function public.wiki_delete_comment(text, uuid, text, text) from public;
revoke execute on function public.wiki_set_status(text, text, uuid, text) from public;
revoke execute on function public.wiki_is_admin(text, text) from public;
grant execute on function public.wiki_list_comments(text, text, int) to anon, authenticated;
grant execute on function public.wiki_add_comment(text, text, text, uuid, text, text, text) to anon, authenticated;
grant execute on function public.wiki_edit_comment(text, uuid, text, text, text) to anon, authenticated;
grant execute on function public.wiki_delete_comment(text, uuid, text, text) to anon, authenticated;
grant execute on function public.wiki_set_status(text, text, uuid, text) to anon, authenticated;
grant execute on function public.wiki_is_admin(text, text) to anon, authenticated;

-- ============================================================================
-- KODLAR — aşağıdaki iki metni kendi kodlarınla değiştir.
--   team_code  : bütün ekiple paylaşılır (okuma + yazma).
--   admin_code : yalnızca proje sorumlusunda kalır (her yorumu yönetme).
-- Kodları daha sonra değiştirmek için bu iki satırı yeni kodlarla tekrar çalıştır.
-- Uzun ve tahmin edilmesi zor kodlar seç (en az 12 karakter).
-- ============================================================================
insert into public.wiki_settings (key, value) values ('team_code',  'BURAYA-EKIP-KODUNU-YAZ')
on conflict (key) do update set value = excluded.value;
insert into public.wiki_settings (key, value) values ('admin_code', 'BURAYA-YONETICI-KODUNU-YAZ')
on conflict (key) do update set value = excluded.value;
