import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { MessageCircle, Zap, Shield, Bot } from "lucide-react";

export default function Landing() {
  const handleGetStarted = () => {
    // For demo authentication, redirect to a simple demo login
    window.location.href = '/api/auth/demo';
  };

  const features = [
    {
      icon: <MessageCircle className="w-8 h-8 text-blue-500" />,
      title: "Real-time Chat",
      description: "Experience seamless, real-time conversations with advanced AI models"
    },
    {
      icon: <Bot className="w-8 h-8 text-green-500" />,
      title: "Multiple AI Models", 
      description: "Access Claude, GPT-4, Gemini, and more AI models in one place"
    },
    {
      icon: <Zap className="w-8 h-8 text-yellow-500" />,
      title: "Voice Integration",
      description: "Talk to AI using voice commands and hear responses back"
    },
    {
      icon: <Shield className="w-8 h-8 text-purple-500" />,
      title: "Private & Secure",
      description: "Your conversations are private and securely stored"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">LineusAPI</h1>
            </div>
            <Button 
              onClick={handleGetStarted}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-all duration-300 hover:scale-105"
              data-testid="button-get-started"
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
            Chat with the
            <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent"> Future </span>
            of AI
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            Experience next-generation AI conversations with multiple models, voice integration,
            and real-time chat capabilities all in one beautiful interface.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={handleGetStarted}
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 text-lg rounded-xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
              data-testid="button-hero-start"
            >
              Start Chatting Now
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="px-8 py-4 text-lg rounded-xl transition-all duration-300 hover:scale-105"
              data-testid="button-learn-more"
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h3 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Why Choose LineusAPI?
          </h3>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Powerful features designed to enhance your AI conversation experience
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index}
              className="group hover:shadow-xl transition-all duration-300 hover:scale-105 border-gray-200 dark:border-gray-700"
              data-testid={`card-feature-${index}`}
            >
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl group-hover:bg-white dark:group-hover:bg-gray-700 transition-colors">
                  {feature.icon}
                </div>
                <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {feature.title}
                </h4>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 py-20">
        <div className="container mx-auto px-6 text-center">
          <h3 className="text-4xl font-bold text-white mb-4">
            Ready to Get Started?
          </h3>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of users already experiencing the future of AI conversations
          </p>
          <Button 
            onClick={handleGetStarted}
            size="lg"
            className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg rounded-xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
            data-testid="button-cta-start"
          >
            Start Your Journey
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <h4 className="text-2xl font-bold">LineusAPI</h4>
            </div>
            <p className="text-gray-400 mb-6">
              The future of AI conversations, today.
            </p>
            <p className="text-gray-500 text-sm">
              © 2025 LineusAPI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}