const { Client } = require('pg');
async function main() {
  const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();

  // Count by make - what do we have?
  const r = await c.query(`
    SELECT make, COUNT(*)::int as active, 
           COUNT(*) FILTER (WHERE date_added > NOW() - INTERVAL '7 days')::int as recent
    FROM listings WHERE status = 'active' 
    GROUP BY make ORDER BY active DESC
  `);
  console.log('=== Current Coverage (make | active | added last 7d) ===');
  r.rows.forEach(row => console.log(`  ${row.make}: ${row.active} (${row.recent} recent)`));

  // Average price per make
  const prices = await c.query(`
    SELECT make, ROUND(AVG(price))::text as avg_price, COUNT(*)::text as count
    FROM listings WHERE status = 'active' AND price > 0
    GROUP BY make ORDER BY AVG(price) DESC LIMIT 15
  `);
  console.log('\n=== Top 15 Most Expensive Makes (avg) ===');
  prices.rows.forEach(row => console.log(`  ${row.make}: €${row.avg_price} (${row.count} listings)`));

  await c.end();
}
main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
