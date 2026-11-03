import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import './styles/globals.css'
import App from './App'
import { useAuthStore } from './stores/auth.store'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // Retry network/server errors only; 4xx responses won't change on retry.
      retry: (failureCount, error) => {
        const status = (error as AxiosError).response?.status
        return failureCount < 2 && !(status && status < 500)
      },
    },
  },
})

// Never show one user's cached data to the next user.
useAuthStore.subscribe((state, prev) => {
  if (prev.token && !state.token) queryClient.clear()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
