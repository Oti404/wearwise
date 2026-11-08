-- Keep updated_at current on every UPDATE.
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER tr_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
--> statement-breakpoint
CREATE TRIGGER tr_user_credentials_updated_at
    BEFORE UPDATE ON user_credentials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
--> statement-breakpoint
CREATE TRIGGER tr_clothes_updated_at
    BEFORE UPDATE ON clothes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
--> statement-breakpoint
-- HNSW index for cosine similarity search over 512-dim CLIP embeddings.
CREATE INDEX idx_clothing_images_embedding
    ON clothing_images USING hnsw (ai_embedding vector_cosine_ops);
--> statement-breakpoint
-- Semantic search: images most similar to a query embedding.
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
