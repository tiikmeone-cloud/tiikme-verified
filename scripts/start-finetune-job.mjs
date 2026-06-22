/**
 * Upload JSONL and start OpenAI fine-tuning job.
 *
 * Run AFTER generate-finetune-data.mjs completes:
 *   OPENAI_API_KEY=sk-... node scripts/start-finetune-job.mjs
 *
 * Fine-tuning takes 15–45 minutes. Watch status:
 *   OPENAI_API_KEY=sk-... node scripts/check-finetune-status.mjs <job-id>
 *
 * Once complete, paste the model ID into src/app/api/twin/route.ts:
 *   model: 'ft:gpt-4o-mini-2024-07-18:tiikme:tiik-coach:xxxxxxxx'
 */

import OpenAI from 'openai'
import { createReadStream, existsSync } from 'fs'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const JSONL_PATH = 'scripts/tiik-finetune-data.jsonl'

async function main() {
  if (!existsSync(JSONL_PATH)) {
    console.error(`${JSONL_PATH} not found. Run generate-finetune-data.mjs first.`)
    process.exit(1)
  }

  console.log('Uploading training file...')
  const file = await openai.files.create({
    file: createReadStream(JSONL_PATH),
    purpose: 'fine-tune',
  })
  console.log('File uploaded:', file.id)

  console.log('\nStarting fine-tuning job...')
  const job = await openai.fineTuning.jobs.create({
    training_file: file.id,
    model: 'gpt-4o-mini-2024-07-18',
    suffix: 'tiik-coach',
    hyperparameters: {
      n_epochs: 3,           // 3 epochs is standard for 50-example sets
    },
  })

  console.log('\n✓ Fine-tuning job started!')
  console.log('Job ID:', job.id)
  console.log('Status:', job.status)
  console.log('\nCheck status:')
  console.log(`  OPENAI_API_KEY=sk-... node scripts/check-finetune-status.mjs ${job.id}`)
  console.log('\nEstimated completion: 15–45 minutes')
  console.log('\nOnce "succeeded", the model ID will look like:')
  console.log('  ft:gpt-4o-mini-2024-07-18:tiikme:tiik-coach:xxxxxxxx')
  console.log('\nReplace in src/app/api/twin/route.ts:')
  console.log("  model: 'ft:gpt-4o-mini-2024-07-18:tiikme:tiik-coach:xxxxxxxx'")
}

main().catch(console.error)
