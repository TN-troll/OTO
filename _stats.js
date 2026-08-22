const { Client } = require('pg');
async function main() {
  const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();

  // Current stats
  const stats = await c.query(`
    SELECT 
      COUNT(*) FILTER (WHERE status = 'active')::text as active,
      COUNT(*) FILTER (WHERE status = 'inactive')::text as inactive,
      COUNT(*) FILTER (WHERE status = 'sold')::text as sold,
      COUNT(*)::text as total
    FROM listings
  `);
  console.log('=== Listing Stats ===');
  console.log(stats.rows[0]);

  // By make (top 20)
  const makes = await c.query(`
    SELECT make, COUNT(*)::text as count 
    FROM listings WHERE status = 'active' 
    GROUP BY make ORDER BY COUNT(*) DESC LIMIT 20
  `);
  console.log('\n=== Top Makes (active) ===');
  makes.rows.forEach(r => console.log(`  ${r.make}: ${r.count}`));

  // Source references — where do listings come from?
  const sources = await c.query(`
    SELECT source, COUNT(*)::text as count
    FROM source_references
    GROUP BY source ORDER BY COUNT(*) DESC
  `);
  console.log('\n=== Sources ===');
  sources.rows.forEach(r => console.log(`  ${r.source}: ${r.count}`));

  // Check freshness
  const freshness = await c.query(`
    SELECT 
      COUNT(*) FILTER (WHERE last_verified > NOW() - INTERVAL '24 hours')::text as last_24h,
      COUNT(*) FILTER (WHERE last_verified > NOW() - INTERVAL '7 days')::text as last_7d,
      COUNT(*) FILTER (WHERE date_added > NOW() - INTERVAL '7 days')::text as added_7d,
      MIN(date_added)::text as oldest,
      MAX(date_added)::text as newest
    FROM listings WHERE status = 'active'
  `);
  console.log('\n=== Freshness ===');
  console.log(freshness.rows[0]);

  await c.end();
}
main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
