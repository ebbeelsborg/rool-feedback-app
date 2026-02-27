/**
 * Migration 001: Initial Normalization
 * Ensures every issue has type: "Issue" and basic valid fields.
 */
export async function up(space) {
  const [res1, res2] = await Promise.all([
    space.findObjects({ where: { type: "issue" }, limit: 500 }),
    space.findObjects({ where: { type: "Issue" }, limit: 500 })
  ]);

  const issues = [...(res1.objects || []), ...(res2.objects || [])];
  console.log(`  Found ${issues.length} issues to normalize.`);

  for (const obj of issues) {
    const raw = obj.data || obj;
    const { id, ...rest } = raw;

    // Explicitly set type to "Issue" (standardizing casing)
    // and ensure createdAt is a number (if missing, use current time)
    const normalized = {
      ...rest,
      type: "Issue",
      createdAt: raw.createdAt || Date.now()
    };

    try {
      await space.updateObject(obj.id, { data: normalized });
      console.log(`  Normalized ${obj.id}`);
    } catch (err) {
      if (err.message.includes("429")) {
        console.warn(`  Rate limited. Waiting 30s...`);
        await new Promise(r => setTimeout(r, 30000));
        await space.updateObject(obj.id, { data: normalized });
        console.log(`  Normalized ${obj.id} (after retry)`);
      } else {
        throw err;
      }
    }
    await new Promise(r => setTimeout(r, 5000)); // 5s delay between successful updates
  }
}
