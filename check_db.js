const { db } = require('./backend/config/firebase');

async function checkData() {
  try {
    const snap = await db.collection('clothes').where('status', '==', 'active').get();
    console.log(`Found ${snap.size} active clothes.`);
    snap.forEach(doc => {
      const data = doc.data();
      console.log(`- ID: ${doc.id}, Name: ${data.name}, userId: ${data.userId}, createdAt: ${data.createdAt?.toDate?.()}`);
    });
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit();
  }
}

checkData();
