const { Client } = require('pg');
async function main() {
  const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();

  // Check source_references table structure
  const cols = await c.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'source_references' ORDER BY ordinal_position`);
  console.log('source_references columns:', cols.rows.map(r => r.column_name).join(', '));

  // Check sources
  const sources = await c.query(`SELECT marketplace, COUNT(*)::text as count FROM source_references GROUP BY marketplace ORDER BY COUNT(*) DESC`);
  console.log('\n=== Marketplace Sources ===');
  sources.rows.forEach(r => console.log(`  ${r.marketplace}: ${r.count}`));

  // Listings with HP thresholds
  const hp = await c.query(`
    SELECT 
      COUNT(*) FILTER (WHERE horsepower >= 200)::text as hp200,
      COUNT(*) FILTER (WHERE horsepower >= 300)::text as hp300,
      COUNT(*) FILTER (WHERE horsepower >= 400)::text as hp400,
      COUNT(*) FILTER (WHERE horsepower >= 500)::text as hp500,
      COUNT(*) FILTER (WHERE horsepower >= 600)::text as hp600,
      COUNT(*) FILTER (WHERE horsepower >= 800)::text as hp800
    FROM listings WHERE status = 'active'
  `);
  console.log('\n=== HP Distribution (active) ===');
  console.log(hp.rows[0]);

  // Curation config — what brands/models are we searching for?
  const curation = await c.query(`SELECT id, make, min_horsepower, min_year, excluded_models FROM curation_config WHERE is_active = true ORDER BY make`);
  console.log('\n=== Active Curation Rules ===');
  curation.rows.forEach(r => console.log(`  ${r.make}: HP>=${r.min_horsepower || 'any'}, Year>=${r.min_year || 'any'}, Excluded: ${r.excluded_models || 'none'}`));

  await c.end();
}
main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
