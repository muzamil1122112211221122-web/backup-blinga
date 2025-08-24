export default function Terms() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white">
      <div className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
          <div className="space-y-6 text-gray-300">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Acceptance of Terms</h2>
              <p>By accessing and using Forus Heavy API, you accept and agree to be bound by the terms and provision of this agreement.</p>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Use License</h2>
              <p>Permission is granted to temporarily download one copy of Forus Heavy API for personal, non-commercial transitory viewing only.</p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>This is the grant of a license, not a transfer of title</li>
                <li>This license shall automatically terminate if you violate any of these restrictions</li>
                <li>Upon terminating your viewing of these materials or upon the termination of this license, you must destroy any downloaded materials</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Disclaimer</h2>
              <p>The materials on Forus Heavy API are provided on an 'as is' basis. Forus Heavy API makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Limitations</h2>
              <p>In no event shall Forus Heavy API or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Forus Heavy API, even if Forus Heavy API or an authorized representative has been notified orally or in writing of the possibility of such damage.</p>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Contact Information</h2>
              <p>If you have any questions about these Terms of Service, please contact us through our application.</p>
            </section>
            
            <div className="mt-8 text-sm text-gray-400">
              <p>Last updated: {new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}