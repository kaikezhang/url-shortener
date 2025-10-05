/**
 * Quick database connection test script
 * Run with: npx ts-node test-db.ts
 */
import { pool, testConnection, closePool } from './src/database';

async function testDatabase() {
  console.log('🔍 Testing database connection...\n');

  // Test connection
  const isConnected = await testConnection();
  if (!isConnected) {
    console.error('❌ Connection failed');
    process.exit(1);
  }

  // Check migrations table
  const migrationsResult = await pool.query(
    'SELECT name, executed_at FROM migrations ORDER BY id'
  );
  console.log('✅ Migrations executed:');
  migrationsResult.rows.forEach((row) => {
    console.log(`   - ${row.name} (${row.executed_at})`);
  });

  // Check urls table structure
  const tableInfo = await pool.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'urls'
    ORDER BY ordinal_position
  `);
  console.log('\n✅ URLs table structure:');
  tableInfo.rows.forEach((col) => {
    console.log(`   - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
  });

  // Check indexes
  const indexes = await pool.query(`
    SELECT indexname, indexdef
    FROM pg_indexes
    WHERE tablename = 'urls'
  `);
  console.log('\n✅ Indexes:');
  indexes.rows.forEach((idx) => {
    console.log(`   - ${idx.indexname}`);
  });

  // Test insert and query
  console.log('\n🧪 Testing insert and query...');
  await pool.query(`
    INSERT INTO urls (short_code, original_url, clicks)
    VALUES ($1, $2, $3)
    ON CONFLICT (short_code) DO NOTHING
  `, ['test123', 'https://example.com', 0]);

  const result = await pool.query(
    'SELECT * FROM urls WHERE short_code = $1',
    ['test123']
  );
  console.log('✅ Test record:', result.rows[0]);

  // Clean up test data
  await pool.query('DELETE FROM urls WHERE short_code = $1', ['test123']);

  console.log('\n✨ All database tests passed!');

  await closePool();
}

testDatabase().catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
