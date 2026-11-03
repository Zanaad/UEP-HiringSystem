import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/button'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-primary text-sm font-semibold">404</p>
      <h1 className="text-3xl font-bold text-gray-900">Page not found</h1>
      <p className="text-gray-600">The page you are looking for doesn't exist.</p>
      <Button asChild>
        <Link to="/">Back to home</Link>
      </Button>
    </div>
  )
}
