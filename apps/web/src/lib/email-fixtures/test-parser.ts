/**
 * Test the email parser against all fixtures.
 * Run with: pnpm --filter @wanderly/web tsx src/lib/email-fixtures/test-parser.ts
 */
import { parseEmail } from "../email-parser";
import fixtures from "./fixtures.json";

async function main() {
  let passed = 0;
  let failed = 0;

  for (const fix of fixtures) {
    const result = await parseEmail({
      subject: fix.subject,
      from: fix.from,
      textBody: fix.text,
    });

    const typeOk = result?.type === fix.expectedType;
    const status = typeOk ? "✅" : "❌";
    if (typeOk) passed++; else failed++;

    console.log(`${status} [${fix.id}]`);
    if (result) {
      console.log(`   type:       ${result.type} (expected: ${fix.expectedType})`);
      console.log(`   title:      ${result.title}`);
      console.log(`   startsAt:   ${result.startsAt}`);
      console.log(`   confidence: ${result.confidence}`);
    } else {
      console.log(`   result: null (expected type: ${fix.expectedType})`);
    }
    console.log();
  }

  console.log(`\n${passed}/${fixtures.length} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
