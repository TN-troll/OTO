const { Client } = require('pg');
async function main() {
  const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();

  // Curation config columns
  const cols = await c.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'curation_config' ORDER BY ordinal_position`);
  console.log('curation_config columns:', cols.rows.map(r => r.column_name).join(', '));

  // Curation rules
  const curation = await c.query(`SELECT * FROM curation_config WHERE is_active = true LIMIT 30`);
  console.log('\n=== Active Curation Rules ===');
  curation.rows.forEach(r => console.log(`  ${JSON.stringify(r)}`));

  await c.end();
}
main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
