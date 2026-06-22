-- Move the pgvector extension out of the `public` schema.
--
-- Finding (2026-06-10 audit): advisor `extension_in_public` — `vector` is in
-- public. Supabase keeps an `extensions` schema on the role search_path, so the
-- vector type, operators and HNSW opclasses resolve transparently after the
-- move. flex_embeddings and ai_job_corpus are currently empty, so this is low
-- risk. Isolated from the RPC-hardening migration so a failure here cannot roll
-- back the security revokes.

alter extension vector set schema extensions;
