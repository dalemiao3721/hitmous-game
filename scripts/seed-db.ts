// Database seeding script per system-design.md §2
// Usage: npx tsx scripts/seed-db.ts

// TODO: Implement test data seeding
// - Insert sample bet_records
// - Insert sample draw_logs
// - Insert sample settlements

async function seedDatabase() {
  console.log('Seeding database with test data...');
  throw new Error('Not yet implemented — requires DB connection setup');
}

seedDatabase().catch(console.error);
