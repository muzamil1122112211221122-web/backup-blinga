export default function Privacy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white">
      <div className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
          <div className="space-y-6 text-gray-300">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Information We Collect</h2>
              <p>When you use Fius, we may collect:</p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>Email address and profile information from Google OAuth</li>
                <li>Chat conversations and messages</li>
                <li>Usage analytics and performance data</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">How We Use Your Information</h2>
              <p>We use your information to:</p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>Provide and improve our AI chat services</li>
                <li>Authenticate your account and maintain sessions</li>
                <li>Analyze usage patterns to enhance user experience</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Data Security</h2>
              <p>We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Contact Us</h2>
              <p>If you have questions about this Privacy Policy, please contact us through our application.</p>
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