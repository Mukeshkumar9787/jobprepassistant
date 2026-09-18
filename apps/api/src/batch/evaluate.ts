import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { BatchInput, BatchOutput, BatchKitResult, BatchInputSchema } from '@jobprep/shared';
import { runGenerationPipeline } from '../services/generator/pipeline';

// Load environment variables from workspace root .env if present
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config();

async function runEvaluate() {
  const args = process.argv.slice(2);
  let inputPath = '';
  let outputPath = '';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--input' && args[i + 1]) {
      inputPath = args[i + 1];
      i++;
    } else if (args[i] === '--output' && args[i + 1]) {
      outputPath = args[i + 1];
      i++;
    }
  }

  if (!inputPath || !outputPath) {
    console.error('Error: Missing required arguments.');
    console.error('Usage: npm run evaluate -- --input <cases.json> --output <kits.json>');
    process.exit(1);
  }

  const resolvedInputPath = path.resolve(process.cwd(), inputPath);
  const resolvedOutputPath = path.resolve(process.cwd(), outputPath);

  console.log(`🚀 Starting batch evaluation CLI...`);
  console.log(`📥 Reading input: ${resolvedInputPath}`);
  console.log(`📤 Writing output: ${resolvedOutputPath}`);

  if (!fs.existsSync(resolvedInputPath)) {
    console.error(`Error: Input file not found: ${resolvedInputPath}`);
    process.exit(1);
  }

  let inputData: BatchInput;
  try {
    const fileContent = fs.readFileSync(resolvedInputPath, 'utf-8');
    const parsed = JSON.parse(fileContent);
    const val = BatchInputSchema.safeParse(parsed);
    if (!val.success) {
      console.error('Error: Input JSON does not match batch input schema:', val.error.format());
      process.exit(1);
    }
    inputData = val.data as BatchInput;
  } catch (err) {
    console.error('Error parsing input JSON:', (err as Error).message);
    process.exit(1);
  }

  console.log(`📋 Found ${inputData.length} test cases to evaluate.`);

  const results: BatchKitResult[] = [];

  for (let idx = 0; idx < inputData.length; idx++) {
    const testCase = inputData[idx];
    console.log(`\n--------------------------------------------------`);
    console.log(`[Case ${idx + 1}/${inputData.length}] Running ID: ${testCase.id} (${testCase.company_url}, ${testCase.days} days)`);

    try {
      const pipelineResult = await runGenerationPipeline({
        jdText: testCase.jd,
        companyUrl: testCase.company_url,
        daysAvailable: testCase.days,
        onProgress: (msg) => console.log(`  [${testCase.id}] ${msg}`),
      });

      results.push({
        id: testCase.id,
        status: 'ok',
        kit: pipelineResult.kit,
        error: null,
      });

      console.log(`✅ Case ${testCase.id} succeeded.`);
    } catch (err) {
      const errorMsg = (err as Error).message || 'Generation failed';
      console.error(`❌ Case ${testCase.id} failed: ${errorMsg}`);

      results.push({
        id: testCase.id,
        status: 'failed',
        kit: null,
        error: {
          code: 'GENERATION_FAILED',
          message: errorMsg,
        },
      });
      // Continue to next case without aborting whole batch!
    }
  }

  const batchOutput: BatchOutput = {
    version: '1.0',
    generated_at: new Date().toISOString(),
    kits: results,
  };

  // Ensure output parent directory exists
  const outDir = path.dirname(resolvedOutputPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(resolvedOutputPath, JSON.stringify(batchOutput, null, 2), 'utf-8');
  console.log(`\n🎉 Batch evaluation complete! Written output to: ${resolvedOutputPath}`);
}

runEvaluate().catch((err) => {
  console.error('Fatal batch evaluation error:', err);
  process.exit(1);
});
