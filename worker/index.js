/* Cloudflare Worker: serves the app's files, plus the sync endpoint (same contract as api/sync.js).
   One encrypted file per passphrase, kept as a row in a D1 database. The browser encrypts
   everything before it gets here (AES-GCM, key derived from the passphrase), and the id is a hash
   the browser also derives from the passphrase — so this only ever sees an unreadable blob under
   an anonymous name.

   GET  /api/sync?id=<64 hex>[&have=<etag>] → 200 {etag, …doc} | 200 {etag, unchanged:true} | 404 {empty:true}
   PUT  /api/sync  {id, etag, doc}           → 200 {etag}       | 409 {conflict:true, current} | 413 {tooLarge:true}
        etag = the version this device last saw; the write only lands if the stored row is still
        that version (null = "create, there should be nothing yet"). Each write is one SQL statement,
        so two devices can never both win. */
const ID = /^[a-f0-9]{64}$/;
const MAX_BYTES = 1_900_000;               /* D1 keeps up to 2 MB in one row */
const MAX_IDS = 5;                         /* one person, one passphrase — a few spare for a change of passphrase */
const SCHEMA = 'CREATE TABLE IF NOT EXISTS docs (id TEXT PRIMARY KEY, etag TEXT NOT NULL, body TEXT NOT NULL, saved_at INTEGER NOT NULL)';

const json = (status, data) => new Response(JSON.stringify(data), {
  status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
});
/* the stored body is the doc's JSON as uploaded: answer {etag, …doc} without re-parsing it */
const withEtag = (status, etag, body) => new Response(`{"etag":${JSON.stringify(etag)},${body.slice(1)}`, {
  status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
});
const validDoc = d => d && typeof d === 'object' && d.v === 1 && typeof d.iv === 'string' && typeof d.ct === 'string'
  && d.iv.length < 64 && typeof d.savedAt === 'number';

let ready = false;
async function db(env) {
  if (!ready) { await env.DB.prepare(SCHEMA).run(); ready = true }
  return env.DB;
}
async function current(DB, id) {
  return DB.prepare('SELECT etag, body FROM docs WHERE id = ?1').bind(id).first();
}

export async function sync(request, env) {
  const url = new URL(request.url);
  try {
    const DB = await db(env);
    if (request.method === 'GET') {
      const id = url.searchParams.get('id') || '', have = url.searchParams.get('have') || '';
      if (!ID.test(id)) return json(400, { error: 'bad id' });
      if (have && have.length < 200) {             /* the device's version still current? then just say so */
        const row = await DB.prepare('SELECT etag FROM docs WHERE id = ?1').bind(id).first();
        if (!row) return json(404, { empty: true });
        if (row.etag === have) return json(200, { etag: row.etag, unchanged: true });
      }
      const row = await current(DB, id);
      if (!row) return json(404, { empty: true });
      return withEtag(200, row.etag, row.body);
    }
    if (request.method === 'PUT') {
      let b;
      try { b = await request.json() } catch (e) { return json(400, { error: 'bad json' }) }
      const { id, etag, doc } = b || {};
      if (!ID.test(String(id || ''))) return json(400, { error: 'bad id' });
      if (!validDoc(doc)) return json(400, { error: 'bad doc' });
      const body = JSON.stringify(doc);
      if (body.length > MAX_BYTES) return json(413, { tooLarge: true, bytes: body.length, max: MAX_BYTES });
      const next = crypto.randomUUID(), now = Date.now();
      let r;
      if (etag) {
        r = await DB.prepare('UPDATE docs SET etag = ?1, body = ?2, saved_at = ?3 WHERE id = ?4 AND etag = ?5')
          .bind(next, body, now, id, String(etag)).run();
      } else {
        /* a new file: only while there's room — strangers can't fill the database */
        r = await DB.prepare(`INSERT INTO docs (id, etag, body, saved_at) SELECT ?1, ?2, ?3, ?4
            WHERE (SELECT COUNT(*) FROM docs) < ?5 ON CONFLICT (id) DO NOTHING`)
          .bind(id, next, body, now, MAX_IDS).run();
        if (!r.meta.changes) {
          const exists = await DB.prepare('SELECT 1 FROM docs WHERE id = ?1').bind(id).first();
          if (!exists) return json(507, { error: 'sync storage is full' });
        }
      }
      if (r.meta.changes === 1) return json(200, { etag: next });
      const cur = await current(DB, id);
      return new Response(`{"conflict":true,"current":${cur ? `{"etag":${JSON.stringify(cur.etag)},${cur.body.slice(1)}` : 'null'}}`, {
        status: 409, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
      });
    }
    return new Response(JSON.stringify({ error: 'method not allowed' }), {
      status: 405, headers: { 'content-type': 'application/json', allow: 'GET, PUT' },
    });
  } catch (e) {
    return json(500, { error: String((e && e.message) || e) });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/sync') return sync(request, env);
    return env.ASSETS.fetch(request);
  },
};
