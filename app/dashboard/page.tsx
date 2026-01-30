import { redirect } from 'next/navigation'

export default function Dashboard() {
  return (
    <main className="main container">
      <section className="section">
        <h1 className="section-title">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="card">
            <h2 className="text-lg font-semibold mb-2">Discover</h2>
            <p className="text-muted text-sm mb-3">Explore new releases and personalized recommendations</p>
            <a href="/dashboard/discover" className="btn btn-sm">Explore</a>
          </div>
          <div className="card">
            <h2 className="text-lg font-semibold mb-2">History</h2>
            <p className="text-muted text-sm mb-3">Your recently played tracks and listening history</p>
            <a href="/dashboard/history" className="btn btn-sm">View History</a>
          </div>
          <div className="card">
            <h2 className="text-lg font-semibold mb-2">Stats</h2>
            <p className="text-muted text-sm mb-3">Your listening statistics and insights</p>
            <a href="/dashboard/stats" className="btn btn-sm">See Stats</a>
          </div>
          <div className="card">
            <h2 className="text-lg font-semibold mb-2">Playlists</h2>
            <p className="text-muted text-sm mb-3">Manage and export your playlists</p>
            <a href="/dashboard/playlists" className="btn btn-sm">Manage Playlists</a>
          </div>
          <div className="card">
            <h2 className="text-lg font-semibold mb-2">Settings</h2>
            <p className="text-muted text-sm mb-3">Customize your experience and preferences</p>
            <a href="/dashboard/settings" className="btn btn-sm">Settings</a>
          </div>
        </div>
      </section>
    </main>
  )
}