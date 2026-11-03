import { Link } from 'react-router-dom'
import { ArrowRight, Brain, Briefcase, CheckCircle2, Gauge, Target, Users } from 'lucide-react'
import Logo from '../../components/Logo'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { homePath, useAuthStore } from '../../stores/auth.store'

const features = [
  {
    icon: Briefcase,
    title: 'Job Management',
    description: 'Create, edit and publish job postings with the skills and experience each role requires.',
  },
  {
    icon: Users,
    title: 'Applicant Tracking',
    description: 'Move candidates through a clear Kanban pipeline, from application to hire.',
  },
  {
    icon: Gauge,
    title: 'ATS Match Scoring',
    description: 'See how well each applicant matches a role based on skills, experience and education.',
  },
  {
    icon: Brain,
    title: 'AI Mock Interviews',
    description: 'Candidates practise with interview questions tailored to the job and get instant feedback.',
  },
]

const recruiterBenefits = [
  'Post and manage job openings in one place',
  'Track every candidate through a structured pipeline',
  'Rank applicants by how well they match the role',
  'Keep notes and history for each candidate',
]

const candidateBenefits = [
  'Search and apply for jobs',
  'Practise with AI mock interviews for a specific role',
  'Get scored feedback and suggestions on every answer',
  'Track the progress of your applications',
]

const stages = ['Applied', 'Screening', 'Interview', 'Technical', 'Offer', 'Hired']

function BenefitList({ icon: Icon, title, description, items }: {
  icon: typeof Users
  title: string
  description: string
  items: string[]
}) {
  return (
    <div>
      <div className="mb-6 flex size-12 items-center justify-center rounded-xl bg-blue-100">
        <Icon className="text-primary" size={24} />
      </div>
      <h2 className="mb-4 text-3xl font-bold text-gray-900">{title}</h2>
      <p className="mb-8 text-lg text-gray-600">{description}</p>
      <ul className="space-y-4">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-3">
            <CheckCircle2 className="text-primary mt-0.5 shrink-0" size={20} />
            <span className="text-gray-700">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function LandingPage() {
  const user = useAuthStore((state) => state.user)

  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-200">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Logo className="text-gray-900" />
          <div className="flex items-center gap-2 sm:gap-4">
            {user ? (
              <Button asChild>
                <Link to={homePath(user.role)}>Go to dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost">
                  <Link to="/login">Log in</Link>
                </Button>
                <Button asChild>
                  <Link to="/register">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      <section className="mx-auto max-w-7xl px-6 py-24 md:py-32">
        <div className="mx-auto max-w-5xl text-center">
          <h1 className="mb-6 text-4xl leading-tight font-bold text-gray-900 md:text-6xl">
            Modern Recruitment
            <br />
            <span className="text-primary">Meets AI-Powered Preparation</span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-xl text-gray-600">
            One platform that helps recruiters hire better and candidates prepare smarter.
          </p>
          <Button asChild size="lg" className="px-8">
            <Link to="/register">
              Get Started
              <ArrowRight size={20} />
            </Link>
          </Button>
        </div>

        <div className="mx-auto mt-16 max-w-5xl rounded-2xl border border-gray-200 bg-gradient-to-br from-blue-50 to-slate-50 p-6 shadow-2xl md:p-10">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {stages.map((stage, index) => (
              <div key={stage} className="rounded-lg border border-gray-200 bg-white p-4 text-center">
                <div className="text-primary mb-1 text-xs font-semibold">Stage {index + 1}</div>
                <div className="font-medium text-gray-900">{stage}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold text-gray-900">Everything you need to hire better</h2>
            <p className="text-xl text-gray-600">Recruitment management and interview preparation in one place</p>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            {features.map(({ icon: Icon, title, description }) => (
              <Card key={title} className="border-gray-200 shadow-sm transition-shadow hover:shadow-md">
                <CardContent className="p-6">
                  <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-blue-100">
                    <Icon className="text-primary" size={24} />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-gray-900">{title}</h3>
                  <p className="text-gray-600">{description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto grid max-w-7xl gap-16 px-6 md:grid-cols-2">
          <BenefitList
            icon={Users}
            title="For Recruiters & HR Teams"
            description="Run your whole hiring process, from job posting to offer, without spreadsheets."
            items={recruiterBenefits}
          />
          <BenefitList
            icon={Target}
            title="For Candidates & Job Seekers"
            description="Prepare for the exact roles you apply to with AI-powered mock interviews."
            items={candidateBenefits}
          />
        </div>
      </section>

      <section className="bg-gradient-to-br from-[#3182ce] to-[#2c5282] py-24">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="mb-6 text-4xl font-bold text-white">Ready to get started?</h2>
          <p className="mb-10 text-xl text-blue-100">Create an account as a recruiter or as a candidate.</p>
          <Button asChild size="lg" className="text-primary bg-white px-8 hover:bg-gray-100">
            <Link to="/register">
              Create your account
              <ArrowRight size={20} />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="bg-sidebar py-10 text-gray-400">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 text-sm md:flex-row">
          <Logo size="sm" className="text-white" />
          <p>Modern recruitment meets AI-powered interview preparation.</p>
          <p>&copy; {new Date().getFullYear()} HirePrep</p>
        </div>
      </footer>
    </div>
  )
}
