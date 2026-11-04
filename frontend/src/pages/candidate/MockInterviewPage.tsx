import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AlertCircle, ArrowLeft, CheckCircle2, Clock, Info, Lightbulb, SkipForward, Target, TrendingUp } from 'lucide-react'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Progress } from '../../components/ui/progress'
import { Textarea } from '../../components/ui/textarea'
import { cn } from '../../components/ui/utils'
import { getApiErrorMessage } from '../../services/api'
import { TRACKS, interviewsService, type InterviewQuestion, type InterviewSession } from '../../services/interviews.service'

const scoreColor = (score: number) => (score >= 75 ? 'text-green-600' : score >= 50 ? 'text-orange-500' : 'text-red-500')

export default function MockInterviewPage() {
  const id = Number(useParams().id)
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [drafts, setDrafts] = useState<Record<number, string>>({})

  const { data: session, isPending, isError } = useQuery({
    queryKey: ['mock-interview', id],
    queryFn: () => interviewsService.get(id),
  })

  const submit = useMutation({
    mutationFn: ({ questionId, answer }: { questionId: number; answer: string }) =>
      interviewsService.answer(id, questionId, answer),
    onSuccess: (question) => {
      queryClient.setQueryData<InterviewSession>(['mock-interview', id], (current) =>
        current && { ...current, questions: current.questions.map((q) => (q.id === question.id ? question : q)) },
      )
      queryClient.invalidateQueries({ queryKey: ['mock-interviews'] })
      setEditingId(null)
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not submit your answer.')),
  })

  const complete = useMutation({
    mutationFn: () => interviewsService.complete(id),
    onSuccess: (updated) => {
      queryClient.setQueryData(['mock-interview', id], updated)
      queryClient.invalidateQueries({ queryKey: ['mock-interviews'] })
      toast.success('Mock interview completed')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not complete the interview.')),
  })

  if (isPending) return <p className="p-8 text-center text-gray-500">Loading interview…</p>
  if (isError || !session) {
    return (
      <div className="p-8 text-center">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">Mock interview not found</h2>
        <Button asChild>
          <Link to="/candidate/mock-interviews">Back to Mock Interviews</Link>
        </Button>
      </div>
    )
  }

  const { questions } = session
  const firstOpen = questions.findIndex((q) => q.answer === null)
  const index = selected ?? (firstOpen === -1 ? 0 : firstOpen)
  const current = questions[index]
  const inProgress = session.status === 'in_progress'
  const showFeedback = current.answer !== null && editingId !== current.id
  const draft = drafts[current.id] ?? current.answer ?? ''
  const answered = questions.filter((q) => q.answer !== null).length
  const scores = questions.flatMap((q) => (q.score !== null ? [q.score] : []))
  const average = scores.length ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length) : null
  const badge = session.track ? TRACKS[session.track].badge : 'bg-blue-100 text-blue-700'

  const goTo = (next: number) => {
    setSelected(next)
    setEditingId(null)
  }

  const submitAnswer = (answer: string) => {
    // Pin the question so its feedback stays on screen once it no longer counts as unanswered.
    setSelected(index)
    submit.mutate({ questionId: current.id, answer: answer.trim() })
  }

  return (
    <div className="p-4 md:p-8">
      <Button asChild variant="ghost" className="mb-4">
        <Link to="/candidate/mock-interviews">
          <ArrowLeft size={20} />
          Back to Mock Interviews
        </Link>
      </Button>

      <div className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="mb-1 text-3xl font-bold text-gray-900">{session.title}</h1>
            <p className="text-sm text-gray-600">
              {session.ai_generated ? 'AI-generated questions' : 'Questions from the HirePrep question bank'} ·{' '}
              {questions.length} questions
            </p>
          </div>
          <div className="sm:text-right">
            <div className="mb-1 text-sm text-gray-500">Progress</div>
            <div className="text-primary text-2xl font-bold">
              {answered} / {questions.length}
            </div>
          </div>
        </div>
        <Progress value={(answered / questions.length) * 100} className="mt-4" />
      </div>

      {!session.ai_feedback_enabled && inProgress && (
        <div className="mb-6 flex items-start gap-3 rounded-xl bg-orange-50 p-4 text-sm text-orange-800">
          <Info size={18} className="mt-0.5 shrink-0" />
          AI feedback isn't configured on this server yet. You can still practise: your answers are saved, but they
          won't be scored.
        </div>
      )}

      {!inProgress && (
        <Card className="mb-6 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-green-100">
              <CheckCircle2 className="text-green-600" size={28} />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">Interview completed</p>
              <p className="text-sm text-gray-600">
                You answered {answered} of {questions.length} questions. Review the feedback below, or start a new
                session to keep practising.
              </p>
            </div>
            <div className={cn('text-4xl font-bold', session.overall_score !== null ? scoreColor(session.overall_score) : 'text-gray-400')}>
              {session.overall_score !== null ? `${session.overall_score}%` : '–'}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-gray-200 shadow-sm lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <Target size={20} className="text-primary" />
                Question {index + 1}
              </CardTitle>
              <Badge className={badge}>{current.category}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-xl bg-gradient-to-br from-blue-50 to-slate-50 p-6">
              <p className="text-lg leading-relaxed font-medium text-gray-900">{current.question}</p>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-blue-50 p-4">
              <Lightbulb className="mt-0.5 shrink-0 text-blue-600" size={18} />
              <div>
                <div className="mb-0.5 text-sm font-medium text-blue-900">Pro Tip</div>
                <p className="text-sm text-blue-800">{current.tip}</p>
              </div>
            </div>

            {showFeedback ? (
              <Feedback
                question={current}
                retrying={submit.isPending}
                onRetry={inProgress ? () => submitAnswer(current.answer!) : undefined}
              />
            ) : (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label htmlFor="answer" className="font-medium text-gray-900">
                    Your Answer
                  </label>
                  <span className="flex items-center gap-1.5 text-sm text-gray-500">
                    <Clock size={15} />
                    No time limit
                  </span>
                </div>
                <Textarea
                  id="answer"
                  rows={10}
                  maxLength={4000}
                  placeholder="Type your answer here…"
                  value={draft}
                  disabled={!inProgress || submit.isPending}
                  onChange={(event) => setDrafts((all) => ({ ...all, [current.id]: event.target.value }))}
                />
                <p className="mt-1 text-right text-xs text-gray-400">{draft.length} / 4000</p>
              </div>
            )}

            {inProgress && (
              <div className="flex flex-wrap items-center gap-3">
                {showFeedback ? (
                  <>
                    {index < questions.length - 1 && (
                      <Button onClick={() => goTo(index + 1)}>
                        Next Question
                        <SkipForward size={17} />
                      </Button>
                    )}
                    <Button variant="outline" onClick={() => setEditingId(current.id)}>
                      Revise Answer
                    </Button>
                  </>
                ) : (
                  <>
                    <Button disabled={!draft.trim() || submit.isPending} onClick={() => submitAnswer(draft)}>
                      <CheckCircle2 size={17} />
                      {submit.isPending ? 'Evaluating your answer…' : 'Submit Answer'}
                    </Button>
                    {index < questions.length - 1 && (
                      <Button variant="ghost" disabled={submit.isPending} onClick={() => goTo(index + 1)}>
                        <SkipForward size={17} />
                        Skip
                      </Button>
                    )}
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="font-semibold">Session Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Answered</span>
                <span className="font-semibold">
                  {answered} / {questions.length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Avg. Score</span>
                <span className="text-primary font-semibold">{average !== null ? `${average}%` : '—'}</span>
              </div>
              {inProgress && (
                <Button
                  className="mt-2 w-full"
                  variant={answered === questions.length ? 'default' : 'outline'}
                  disabled={answered === 0 || complete.isPending}
                  onClick={() => complete.mutate()}
                >
                  {complete.isPending ? 'Finishing…' : 'Finish Interview'}
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="font-semibold">Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {questions.map((q, i) => {
                const active = i === index
                const done = q.answer !== null
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => goTo(i)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors',
                      active ? 'bg-primary text-white' : done ? 'bg-green-50 text-gray-900' : 'bg-gray-50 text-gray-700 hover:bg-gray-100',
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                        active ? 'text-primary bg-white' : done ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600',
                      )}
                    >
                      {done && !active ? <CheckCircle2 size={14} /> : i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-medium">
                        Q{i + 1} — {q.category}
                      </span>
                      {q.score !== null && (
                        <span className={cn('text-xs', active ? 'text-blue-100' : 'text-green-600')}>Score: {q.score}%</span>
                      )}
                    </span>
                  </button>
                )
              })}
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="flex items-start gap-3 p-4 text-sm text-blue-900">
              <Lightbulb className="mt-0.5 shrink-0 text-blue-600" size={18} />
              <div>
                <p className="mb-1 font-medium">Interview Tip</p>
                <p>Think out loud. Interviewers evaluate your reasoning, not just the final answer.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Feedback({ question, retrying, onRetry }: { question: InterviewQuestion; retrying: boolean; onRetry?: () => void }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
        <p className="mb-1 text-xs font-semibold tracking-wide text-gray-500 uppercase">Your answer</p>
        <p className="text-sm whitespace-pre-line text-gray-800">{question.answer}</p>
      </div>

      {question.score === null ? (
        <div className="flex flex-col gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4 sm:flex-row sm:items-center">
          <AlertCircle className="shrink-0 text-orange-500" size={20} />
          <p className="flex-1 text-sm text-orange-800">Your answer is saved, but AI feedback isn't available right now.</p>
          {onRetry && (
            <Button size="sm" variant="outline" disabled={retrying} onClick={onRetry}>
              {retrying ? 'Retrying…' : 'Try again'}
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="flex items-center gap-4 rounded-xl border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-5">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-green-100">
              <TrendingUp className="text-green-600" size={26} />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-gray-900">AI Feedback Score</div>
              <div className="text-sm text-gray-500">Based on relevance, structure, depth and clarity</div>
            </div>
            <div className={cn('text-4xl font-bold', scoreColor(question.score))}>{question.score}%</div>
          </div>
          <FeedbackList title="What You Did Well" items={question.strengths} tone="green" />
          <FeedbackList title="Areas to Improve" items={question.improvements} tone="orange" />
          {question.suggestion && (
            <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4">
              <p className="mb-1 flex items-center gap-2 font-medium text-blue-900">
                <Lightbulb size={18} className="text-blue-500" />
                AI Suggestion
              </p>
              <p className="text-sm text-gray-700">{question.suggestion}</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function FeedbackList({ title, items, tone }: { title: string; items: string[] | null; tone: 'green' | 'orange' }) {
  if (!items?.length) return null
  const green = tone === 'green'
  return (
    <div className={cn('rounded-xl border p-4', green ? 'border-green-200 bg-green-50/40' : 'border-orange-200 bg-orange-50/40')}>
      <p className={cn('mb-2 flex items-center gap-2 font-medium', green ? 'text-green-900' : 'text-orange-900')}>
        {green ? <CheckCircle2 size={18} className="text-green-600" /> : <AlertCircle size={18} className="text-orange-500" />}
        {title}
      </p>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
            <span className={cn('mt-1.5 size-1.5 shrink-0 rounded-full', green ? 'bg-green-500' : 'bg-orange-400')} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
