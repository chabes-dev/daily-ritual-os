/* Sync storage for the app: one encrypted file per passphrase, in a private Vercel Blob store.
   The browser encrypts everything before it gets here (AES-GCM, key derived from the
   passphrase), and the file name is a hash the browser also derives from the passphrase —
   so this function only ever sees an unreadable blob under an anonymous name.

   GET  /api/sync?id=<64 hex>          → 200 {etag, …doc} | 404 {empty:true}
   PUT  /api/sync  {id, etag, doc}     → 200 {etag}       | 409 {conflict:true, current}
        etag = the version this device last saw; the write only lands if the stored file
        is still that version (null = "create, there should be nothing yet"). */
import { get, put, del, BlobPreconditionFailedError } from '@vercel/blob';

const ID = /^[a-f0-9]{64}$/;
const MAX_BYTES = 3_500_000;               /* under the 4.5 MB function body limit */
const pathOf = id => `sync/${id}.json`;

async function readCurrent(blob, id) {
  const r = await blob.get(pathOf(id), { access: 'private', useCache: false });
  if (!r || r.statusCode !== 200) return null;
  const text = await new Response(r.stream).text();
  return { etag: r.blob.etag, doc: JSON.parse(text) };
}
const validDoc = d => d && typeof d === 'object' && d.v === 1 && typeof d.iv === 'string' && typeof d.ct === 'string'
  && d.iv.length < 64 && typeof d.savedAt === 'number';

export async function handle(req, res, blob) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    if (req.method === 'GET') {
      if (req.query.selftest === '1') {          /* write → read → delete a scratch file */
        const p = 'selftest/ping.json', body = JSON.stringify({ at: Date.now() });
        await blob.put(p, body, { access: 'private', contentType: 'application/json', allowOverwrite: true });
        const r = await blob.get(p, { access: 'private', useCache: false });
        const back = r && r.statusCode === 200 ? await new Response(r.stream).text() : null;
        await blob.del(p);
        return res.status(200).json({ ok: back === body });
      }
      const id = String(req.query.id || '');
      if (!ID.test(id)) return res.status(400).json({ error: 'bad id' });
      const cur = await readCurrent(blob, id);
      if (!cur) return res.status(404).json({ empty: true });
      return res.status(200).json({ etag: cur.etag, ...cur.doc });
    }
    if (req.method === 'PUT') {
      const b = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const { id, etag, doc } = b;
      if (!ID.test(String(id || ''))) return res.status(400).json({ error: 'bad id' });
      if (!validDoc(doc)) return res.status(400).json({ error: 'bad doc' });
      const body = JSON.stringify(doc);
      if (body.length > MAX_BYTES) return res.status(413).json({ error: 'too large' });
      try {
        const r = await blob.put(pathOf(id), body, {
          access: 'private', contentType: 'application/json', addRandomSuffix: false,
          ...(etag ? { ifMatch: String(etag) } : { allowOverwrite: false }),
        });
        return res.status(200).json({ etag: r.etag });
      } catch (e) {
        const lost = (BlobPreconditionFailedError && e instanceof BlobPreconditionFailedError)
          || e.name === 'BlobPreconditionFailedError' || /already exists|precondition/i.test(String(e.message));
        if (!lost) throw e;
        const cur = await readCurrent(blob, id);
        return res.status(409).json({ conflict: true, current: cur ? { etag: cur.etag, ...cur.doc } : null });
      }
    }
    res.setHeader('Allow', 'GET, PUT');
    return res.status(405).json({ error: 'method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
}

export default function handler(req, res) {
  return handle(req, res, { get, put, del });
}
