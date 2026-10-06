import { ExamWorkspace } from '@/components/layout/ExamWorkspace'
import { ExamProvider } from '@/state/ExamProvider'

export default function App() {
  return (
    <ExamProvider>
      <ExamWorkspace />
    </ExamProvider>
  )
}