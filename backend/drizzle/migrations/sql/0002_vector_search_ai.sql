-- 1. ASIGURARE EXTENSIE VECTOR (Am făcut-o deja, dar pentru siguranță)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. CREARE INDEX HNSW (Hierarchical Navigable Small Worlds)
-- Aceasta este cea mai rapidă metodă de căutare în vectori mari (dimensiune 512 pentru CLIP)
-- Folosim 'vector_cosine_ops' pentru că distanța cosinus este cea mai bună pentru imagini/modele CLIP.
CREATE INDEX ON clothing_images 
USING hnsw (ai_embedding vector_cosine_ops);

-- 3. FUNCȚIE RPC PENTRU CĂUTARE SEMANTICĂ (Similar Items)
-- Poate fi apelată din React Native sau Node.js via supabase.rpc('get_similar_clothes', { ... })
CREATE OR REPLACE FUNCTION get_similar_clothes (
  query_embedding vector(512),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  clothing_id uuid,
  url text,
  similarity float,
  cloth_name text,
  price double precision
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    img.id,
    img.clothing_id,
    img.url,
    1 - (img.ai_embedding <=> query_embedding) AS similarity,
    c.name,
    c.price
  FROM clothing_images img
  JOIN clothes c ON img.clothing_id = c.id
  WHERE 1 - (img.ai_embedding <=> query_embedding) > match_threshold
  ORDER BY img.ai_embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
