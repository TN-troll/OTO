const { Client } = require('pg');
async function main() {
  const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();

  const curation = await c.query(`SELECT * FROM curation_config LIMIT 30`);
  console.log('=== Curation Config ===');
  curation.rows.forEach(r => console.log(JSON.stringify(r)));

  // What makes are NOT in our database that should be?
  const makes = await c.query(`SELECT DISTINCT make FROM listings WHERE status = 'active' ORDER BY make`);
  console.log('\n=== All Active Makes ===');
  console.log(makes.rows.map(r => r.make).join(', '));

  await c.end();
}
main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
