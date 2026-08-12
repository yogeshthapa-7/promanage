// import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions:{
    queries:{
      refetchOnWindowFocus: false,
      staleTime: 2 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
    },
  },
});

(globalThis as unknown as { __promanageQueryClient?: typeof queryClient }).__promanageQueryClient = queryClient;

createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <QueryClientProvider client={queryClient}>
    <App />
    </QueryClientProvider>
  </AuthProvider>,
)
