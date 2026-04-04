/**
 * SUPABASE SERVICE (WearWise 2.0)
 * Acest serviciu se va ocupa exclusiv de datele relaționale din SQL.
 */
import { db } from '../drizzle/db';
import { users, clothes, clothingImages } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

export const supabaseService = {
  
  /**
   * TEST: Crearea unui profil de test și a unei haine
   */
  async createTestData() {
    console.log("[SQL TEST] 🏗️ Începem testarea bazei de date...");
    
    try {
      // 1. Creăm un user de test (dacă nu există deja email-ul)
      const testEmail = "test@wearwise.com";
      const existingUser = await db.query.users.findFirst({
         where: eq(users.email, testEmail)
      });
      
      let userId;
      if (!existingUser) {
        console.log("[SQL TEST] 👤 Cream user de test...");
        const result = await db.insert(users).values({
          authUid: "test-auth-uid-123",
          email: testEmail,
          firstName: "Wear",
          lastName: "Wise",
          city: "Frankfurt"
        }).returning({ id: users.id });
        userId = result[0].id;
      } else {
        userId = existingUser.id;
      }

      // 2. Creăm o haină de test
      console.log("[SQL TEST] 👕 Cream haină de test...");
      const clothResult = await db.insert(clothes).values({
        userId: userId,
        name: "Vintage Jacket (SQL)",
        price: 199.99,
        category: "Outerwear",
        size: "L",
        condition: "Good",
        mode: "sell",
        status: "active"
      }).returning({ id: clothes.id });
      
      const clothingId = clothResult[0].id;

      // 3. Creăm o imagine simulată
      console.log("[SQL TEST] 🖼️ Adăugăm imaginea...");
      await db.insert(clothingImages).values({
        clothingId: clothingId,
        url: "https://example.com/sql-jacket.jpg",
        isPrimary: true
      });

      console.log(`[SQL TEST] ✅ Succes! Haina a fost creată cu ID: ${clothingId}`);
      return clothingId;

    } catch (error) {
      console.error("[SQL TEST] ❌ Eroare la testul SQL:", error);
      throw error;
    }
  },

  /**
   * Recuperarea feed-ului din SQL (Adevăratul Infinite Scroll viitor)
   */
  async getExploreFeed({ limit = 10 } = {}) {
    const results = await db.query.clothes.findMany({
      where: eq(clothes.status, "active"),
      with: {
        images: true,
        user: true
      },
      limit: limit,
      orderBy: (clothes, { desc }) => [desc(clothes.createdAt)]
    });
    return results;
  }
};
