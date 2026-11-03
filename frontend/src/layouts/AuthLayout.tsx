import type { ReactNode } from 'react'
import Logo from '../components/Logo'

interface AuthLayoutProps {
  title: string
  subtitle: string
  footer: ReactNode
  children: ReactNode
}

export default function AuthLayout({ title, subtitle, footer, children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Logo size="lg" className="text-gray-900" />
          <p className="mt-2 text-gray-600">{subtitle}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-xl">
          <h1 className="mb-6 text-2xl font-bold text-gray-900">{title}</h1>
          {children}
          <div className="mt-6 text-center text-sm text-gray-600">{footer}</div>
        </div>
      </div>
    </div>
  )
}
