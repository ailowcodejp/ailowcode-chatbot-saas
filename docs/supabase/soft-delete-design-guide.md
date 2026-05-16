# Supabase ソフトデリート設計ガイド

## 目的

本書は、Supabase / PostgreSQL を使うアプリでのソフトデリート方針を定義する共通ガイドです。

個人向けアプリでも法人向けSaaSでも、ユーザーデータや業務データを扱う場合は、原則として物理削除ではなく `deleted_at` による論理削除を標準にします。

---

## 適用範囲

この方針は、次のようなテーブルに適用します。

- ユーザーが作成・編集するデータ
- 復元や監査が必要なデータ
- 誤削除がユーザー体験や運用に影響するデータ
- 法人向けSaaSで組織分離される業務データ
- 個人向けアプリでユーザー所有となるデータ

例:

- `projects`
- `documents`
- `customers`
- `deals`
- `organization_memberships`
- `organization_invitations`
- `generated_assets`

一方、次のようなデータは物理削除を許容できます。

- 完全に再生成可能なキャッシュ
- 一時ジョブ
- セッションや短期トークン
- 期限切れのワンタイムデータ
- 法令・規約上、即時削除が必要なデータ

---

## 基本方針

1. 業務データは `deleted_at timestamptz` を持たせる。
2. 通常の一覧・詳細取得では `deleted_at is null` の行だけを扱う。
3. `authenticated` ロールからの物理 `DELETE` は原則禁止する。
4. 削除操作は RPC / Server Action / Edge Function のいずれかに閉じ込める。
5. 削除・復元・パージは監査対象として扱う。
6. マルチテナントSaaSでは `organization_id` と `deleted_at` の両方でアクセス境界を守る。

---

## 標準カラム

```sql
deleted_at timestamptz null
```

推奨する共通カラム構成:

```sql
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
deleted_at timestamptz null
```

`deleted_at` は `timestamptz` で統一します。アプリ側でタイムゾーンを解釈し、DBにはUTC基準の時刻として保存します。

---

## Supabase / RLS の基本パターン

### 個人向けアプリ

ユーザー所有データでは、`user_id` と `deleted_at` を使って分離します。

```sql
create policy projects_select_own_active
on public.projects
for select
to authenticated
using (
  user_id = auth.uid()
  and deleted_at is null
);

create policy projects_update_own_active
on public.projects
for update
to authenticated
using (
  user_id = auth.uid()
  and deleted_at is null
)
with check (
  user_id = auth.uid()
);
```

### 法人向けSaaS

組織所有データでは、`organization_id` と `deleted_at` を使って分離します。

```sql
create policy customers_select_org_active
on public.customers
for select
to authenticated
using (
  public.is_member(organization_id)
  and organization_id = (
    current_setting('request.jwt.claims', true)::json
      -> 'app_metadata'
      ->> 'organization_id'
  )::uuid
  and deleted_at is null
);

create policy customers_update_org_active
on public.customers
for update
to authenticated
using (
  public.is_member(organization_id)
  and deleted_at is null
)
with check (
  organization_id = (
    current_setting('request.jwt.claims', true)::json
      -> 'app_metadata'
      ->> 'organization_id'
  )::uuid
);
```

---

## 削除操作の実装方針

削除はクライアントから直接 `update({ deleted_at: new Date() })` しないことを標準にします。

理由:

- 権限チェックがクライアントに散らばる
- `deleted_at` 以外の固定列まで誤更新される可能性がある
- RLS の `deleted_at is null` と `RETURNING *` が競合しやすい
- 監査ログや関連データ検証を一箇所に集めにくい

推奨順:

1. 単純な削除: `SECURITY DEFINER` RPC
2. 外部連携や通知がある削除: Edge Function
3. Next.js UIに閉じた削除: Server Action から RPC / Edge Function を呼ぶ

---

## RPC の基本形

```sql
create or replace function public.soft_delete_project(p_project_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted public.projects%rowtype;
begin
  update public.projects
  set deleted_at = now()
  where id = p_project_id
    and user_id = auth.uid()
    and deleted_at is null
  returning * into v_deleted;

  if not found then
    raise exception 'project not found or already deleted';
  end if;

  return jsonb_build_object(
    'ok', true,
    'id', v_deleted.id,
    'deleted_at', v_deleted.deleted_at
  );
end;
$$;
```

法人向けSaaSでは、RPC内で次も検証します。

- 対象行の `organization_id`
- 呼び出しユーザーの組織所属
- JWT の `app_metadata.organization_id` との一致
- ロール要件

---

## DELETE 権限

通常ユーザーには物理 `DELETE` を許可しません。

```sql
revoke delete on table public.projects from authenticated;
```

RLSの `DELETE` ポリシーを定義するより、通常は物理削除権限自体を閉じます。

物理削除が必要な場合は、サービスロール経由のパージ処理に限定します。

---

## 復元方針

復元を提供する場合は、通常の更新とは別の操作として扱います。

推奨:

- 管理者向け UI から専用 RPC / Edge Function を呼ぶ
- 復元前に所有者または組織所属を検証する
- 復元後に `updated_at` を更新する
- 監査ログに復元操作を残す

復元しないプロダクトでも、運用者による一時的な復旧が必要になることがあります。その場合は、サービスロールを使う内部手順として定義します。

---

## パージ方針

ソフトデリートされたデータを永久に残す必要はありません。

パージは、次の条件を満たす行を対象にします。

- `deleted_at` から一定期間が経過している
- 復元要求の受付期間を過ぎている
- 法務・監査・請求上の保持義務がない
- 依存する子データの扱いが決まっている

実行はサービスロールの定期バッチまたは管理者向け内部ジョブに限定します。

```sql
delete from public.projects
where deleted_at < now() - interval '90 days';
```

実運用では、親子関係を考慮して子テーブルから順にパージします。

---

## 監査ログ

削除・復元・パージは監査対象です。

最低限記録する項目:

- 操作種別: `soft_delete`, `restore`, `purge`
- テーブル名
- レコードID
- 操作ユーザーID
- `organization_id` または `user_id`
- 実行時刻
- IP / User-Agent
- 旧値・新値が必要な場合は差分

個人向けアプリでは `user_id`、法人向けSaaSでは `organization_id` を必ず追跡できるようにします。

---

## 実装チェックリスト

- [ ] 対象テーブルに `deleted_at timestamptz` がある
- [ ] 通常の `SELECT` RLS に `deleted_at is null` が入っている
- [ ] 通常の `UPDATE` RLS に `deleted_at is null` が入っている
- [ ] `authenticated` から物理 `DELETE` を revoke している
- [ ] 削除は RPC / Edge Function / Server Action に閉じている
- [ ] 復元方針を決めている
- [ ] パージ方針を決めている
- [ ] 削除・復元・パージを監査ログに残す
- [ ] 法人向けSaaSでは `organization_id` の不変性も守っている
