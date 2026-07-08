const { Client } = require('pg');
const { cleanAiNotesContent } = require('./src/lib/ai-notes');

async function run() {
  const client = new Client({
    connectionString: "postgresql://postgres:eddva-dev@eddva-dev.cpo2kqqgu55d.ap-south-1.rds.amazonaws.com:5432/eddva_coaching",
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Connected.");

    const res = await client.query(`
      SELECT ai_notes_markdown FROM lectures
      WHERE id = '5dd58031-5c1f-485c-bd70-0894e73367dc'
    `);
    
    const notes = res.rows[0].ai_notes_markdown;
    console.log("Notes loaded. Length:", notes.length);

    console.time("cleanAiNotesContent");
    const cleaned = cleanAiNotesContent(notes);
    console.timeEnd("cleanAiNotesContent");
    
    console.log("Cleaned length:", cleaned.length);

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
