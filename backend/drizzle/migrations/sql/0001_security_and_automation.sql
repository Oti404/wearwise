-- 1. FUNCȚIE PENTRU ACTUALIZARE AUTOMATĂ updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 2. APLICARE TRIGGER PE TABELA USERS
DROP TRIGGER IF EXISTS tr_users_updated_at ON users;
CREATE TRIGGER tr_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- 3. APLICARE TRIGGER PE TABELA CLOTHES
DROP TRIGGER IF EXISTS tr_clothes_updated_at ON clothes;
CREATE TRIGGER tr_clothes_updated_at
    BEFORE UPDATE ON clothes
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- 4. ACTIVARE ROW LEVEL SECURITY (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clothes ENABLE ROW LEVEL SECURITY;
ALTER TABLE clothing_images ENABLE ROW LEVEL SECURITY;

-- 5. POLITICI DE SECURITATE (Users)
-- Oricine poate vedea profiluri, dar doar user-ul își poate modifica datele
CREATE POLICY "Public profiles are viewable by everyone" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = auth_uid);

-- 6. POLITICI DE SECURITATE (Clothes)
-- Oricine poate vedea hainele, dar doar proprietarul le poate șterge/edita
CREATE POLICY "Clothes are viewable by everyone" ON clothes FOR SELECT USING (true);
CREATE POLICY "Users can insert own clothes" ON clothes FOR INSERT WITH CHECK (true); -- Verificat în backend prin middleware
CREATE POLICY "Users can update own clothes" ON clothes FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = clothes.user_id 
    AND users.auth_uid = auth.uid()::text
  )
);
CREATE POLICY "Users can delete own clothes" ON clothes FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = clothes.user_id 
    AND users.auth_uid = auth.uid()::text
  )
);

-- 7. POLITICI DE SECURITATE (Images)
CREATE POLICY "Images are viewable by everyone" ON clothing_images FOR SELECT USING (true);
CREATE POLICY "Users can manage images of their clothes" ON clothing_images FOR ALL USING (
  EXISTS (
    SELECT 1 FROM clothes 
    JOIN users ON clothes.user_id = users.id
    WHERE clothes.id = clothing_images.clothing_id
    AND users.auth_uid = auth.uid()::text
  )
);
