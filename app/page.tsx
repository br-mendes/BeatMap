import LoginPage from '@/components/LoginPage'

export default function Home() {
  return (
    <main className="main container">
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="w-full max-w-md">
          <LoginPage />
        </div>
      </div>
    </main>
  )
}