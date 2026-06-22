/**
 * Poll fine-tuning job status.
 * Usage: OPENAI_API_KEY=sk-... node scripts/check-finetune-status.mjs <job-id>
 */

import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const jobId = process.argv[2]

if (!jobId) {
  console.error('Usage: node check-finetune-status.mjs <job-id>')
  process.exit(1)
}

async function main() {
  const job = await openai.fineTuning.jobs.retrieve(jobId)

  console.log('Job:', job.id)
  console.log('Status:', job.status)
  console.log('Model:', job.fine_tuned_model ?? 'not yet assigned')
  console.log('Training file:', job.training_file)
  console.log('Created:', new Date(job.created_at * 1000).toLocaleString())

  if (job.estimated_finish) {
    console.log('Est. finish:', new Date(job.estimated_finish * 1000).toLocaleString())
  }

  if (job.status === 'succeeded') {
    console.log('\n✓ Fine-tuning complete!')
    console.log('Fine-tuned model ID:', job.fine_tuned_model)
    console.log('\nUpdate src/app/api/twin/route.ts:')
    console.log(`  model: '${job.fine_tuned_model}'`)
  } else if (job.status === 'failed') {
    console.log('\n✗ Fine-tuning failed.')
    console.log('Error:', job.error?.message ?? 'unknown')
  } else {
    console.log('\nStill running. Check again in a few minutes.')
  }

  // Show recent events
  const events = await openai.fineTuning.jobs.listEvents(jobId, { limit: 5 })
  if (events.data.length) {
    console.log('\nRecent events:')
    events.data.reverse().forEach(e => {
      console.log(' ', new Date(e.created_at * 1000).toLocaleTimeString(), '-', e.message)
    })
  }
}

main().catch(console.error)
