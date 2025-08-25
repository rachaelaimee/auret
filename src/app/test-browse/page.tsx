export default function TestBrowse() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-8">
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">
          🎉 BROWSE PAGE WORKS! 🎉
        </h1>
        <p className="text-lg text-slate-600 mb-4">
          This is a simple test page with NO Firebase dependencies.
        </p>
        <p className="text-slate-600">
          If you can see this, then Vercel deployment is working and the issue 
          was with Firebase/Auth calls in the main browse page.
        </p>
        <div className="mt-8 p-4 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Debug Info:</h2>
          <ul className="list-disc list-inside text-sm text-slate-600">
            <li>Route: /test-browse</li>
            <li>No Firebase calls</li>
            <li>No Auth dependencies</li>
            <li>Pure Next.js page</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
