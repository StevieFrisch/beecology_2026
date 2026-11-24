import { useSearchParams } from 'react-router-dom'
import Wizard from './Wizard.jsx'
import { getDraft } from '../data'
import { captureStep } from './CaptureStep.jsx'
import { beeSteps, saveBee } from './BeeFlow.jsx'
import { butterflySteps, saveButterfly } from './ButterflyFlow.jsx'
import { today } from './SharedSteps.jsx'

/*
  The whole collection flow at /collect. Step 1 (Capture) is shared: upload media and pick
  bee or butterfly. The remaining steps follow that choice (bees until one is picked).
  /collect?draft=<id> continues a saved draft at the step it was saved on.
*/
export default function CollectFlow() {
  const [params] = useSearchParams()
  const draft = getDraft(params.get('draft'))
  return (
    <Wizard
      // A new key starts fresh state when switching between a draft and a new log
      key={draft?.id || 'new'}
      draftId={draft?.id}
      initial={draft?.data || { date: today() }}
      initialStep={draft?.step || 0}
      steps={(d) => [captureStep, ...(d.kind === 'butterfly' ? butterflySteps : beeSteps)]}
      onFinish={(d) => (d.kind === 'butterfly' ? saveButterfly(d) : saveBee(d))}
    />
  )
}
