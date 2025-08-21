import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { MessageCircle, Zap, Shield, Bot } from "lucide-react";

export default function Landing() {
  const handleGetStarted = () => {
    // For demo authentication, redirect to a simple demo login
    window.location.href = '/api/auth/demo?redirect=/chat';
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
      description: "Access Claude 3.5 Sonnet, GPT-4o, Gemini Pro, Llama 3, plus our exclusive Forus-Intelligence models"
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
    <div className="min-h-screen relative overflow-hidden bg-black">
      {/* Animated Black Hole Background */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Outer event horizon rings */}
        <div className="absolute w-[800px] h-[800px] rounded-full bg-gradient-radial from-transparent via-white/10 to-transparent animate-spin-slow"></div>
        <div className="absolute w-[600px] h-[600px] rounded-full bg-gradient-radial from-transparent via-white/15 to-transparent animate-spin-reverse"></div>
        
        {/* Main black hole */}
        <div className="absolute w-[400px] h-[400px] rounded-full bg-gradient-radial from-black via-black to-transparent shadow-[0_0_200px_rgba(255,255,255,0.1)]">
          {/* Accretion disk */}
          <div className="absolute inset-0 rounded-full bg-gradient-conic from-white/20 via-white/10 to-transparent animate-spin opacity-60"></div>
          <div className="absolute inset-4 rounded-full bg-gradient-conic from-white/15 via-white/20 to-transparent animate-spin-slow opacity-40"></div>
          
          {/* Event horizon */}
          <div className="absolute inset-16 rounded-full bg-black shadow-inner"></div>
          
          {/* Gravitational lensing effect */}
          <div className="absolute inset-8 rounded-full bg-gradient-radial from-transparent via-white/5 to-transparent animate-pulse"></div>
        </div>
        
        {/* Distant stars */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-1 h-1 bg-white rounded-full animate-twinkle"></div>
          <div className="absolute top-40 right-32 w-0.5 h-0.5 bg-white rounded-full animate-twinkle-delay"></div>
          <div className="absolute bottom-32 left-40 w-0.5 h-0.5 bg-white rounded-full animate-twinkle"></div>
          <div className="absolute top-1/3 right-20 w-1 h-1 bg-white rounded-full animate-twinkle-delay"></div>
          <div className="absolute bottom-20 right-20 w-0.5 h-0.5 bg-white rounded-full animate-twinkle"></div>
        </div>
      </div>
      
      {/* Content overlay */}
      <div className="relative z-10 min-h-screen bg-black/40">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-black/80 border-b border-white/20">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-white to-black rounded-lg flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">Forus Heavy API</h1>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                onClick={handleGetStarted}
                className="bg-white hover:bg-gray-100 text-gray-800 px-6 py-2 rounded-lg transition-all duration-300 hover:scale-105 flex items-center space-x-2 shadow-lg"
                data-testid="button-start-chat"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Begin Experience</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Chat with the
            <span className="bg-gradient-to-r from-gray-300 via-gray-600 to-gray-300 bg-clip-text text-transparent"> Future </span>
            of AI
          </h2>
          <p className="text-xl text-gray-300 mb-8 leading-relaxed">
            Experience next-generation AI conversations with multiple models, voice integration,
            and real-time chat capabilities all in one beautiful interface.
          </p>
          <div className="flex justify-center">
            <Button 
              onClick={handleGetStarted}
              size="lg"
              className="bg-white hover:bg-gray-100 text-gray-800 px-12 py-6 text-xl rounded-xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center space-x-4"
              data-testid="button-hero-start"
            >
              <MessageCircle className="w-6 h-6" />
              <span>Begin Experience</span>
            </Button>
          </div>
          <div className="text-center mt-6 text-gray-300">
            <p className="text-lg">No sign-up required • Access all AI models instantly</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h3 className="text-4xl font-bold text-white mb-4">
            Why Choose Forus Heavy API?
          </h3>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Powerful features designed to enhance your AI conversation experience
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index}
              className="group hover:shadow-xl transition-all duration-300 hover:scale-105 border-white/20 bg-black/60 backdrop-blur-sm"
              data-testid={`card-feature-${index}`}
            >
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-3 bg-white/10 rounded-xl group-hover:bg-white/20 transition-colors">
                  {feature.icon}
                </div>
                <h4 className="text-xl font-semibold text-white">
                  {feature.title}
                </h4>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-300 leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* AI Models Showcase Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h3 className="text-4xl font-bold text-white mb-4">
            Powered by Leading AI Models
          </h3>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Access the most advanced AI models in the industry, plus our exclusive Forus-Intelligence models
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-white/20 bg-gradient-to-br from-gray-800/60 to-gray-600/40 backdrop-blur-sm">
            <CardHeader>
              <h4 className="text-xl font-semibold text-white">Claude 3.5 Sonnet</h4>
              <p className="text-gray-200">Anthropic's most advanced model</p>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300">Superior reasoning, coding, and creative writing capabilities</p>
            </CardContent>
          </Card>
          
          <Card className="border-white/20 bg-gradient-to-br from-gray-700/50 to-gray-800/60 backdrop-blur-sm">
            <CardHeader>
              <h4 className="text-xl font-semibold text-white">GPT-4o</h4>
              <p className="text-gray-200">OpenAI's flagship model</p>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300">Multimodal AI with vision, reasoning, and code generation</p>
            </CardContent>
          </Card>
          
          <Card className="border-white/20 bg-gradient-to-br from-gray-800/50 to-gray-700/60 backdrop-blur-sm">
            <CardHeader>
              <h4 className="text-xl font-semibold text-white">Gemini Pro</h4>
              <p className="text-gray-200">Google's most capable AI</p>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300">Advanced reasoning and multimodal understanding</p>
            </CardContent>
          </Card>
          
          <Card className="border-white/20 bg-gradient-to-br from-gray-600/40 to-gray-800/50 backdrop-blur-sm">
            <CardHeader>
              <h4 className="text-xl font-semibold text-white">Llama 3</h4>
              <p className="text-gray-200">Meta's open-source powerhouse</p>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300">High-performance open-source model for all tasks</p>
            </CardContent>
          </Card>
          
          <Card className="border-white/20 bg-gradient-to-br from-gray-800/40 to-gray-600/50 backdrop-blur-sm">
            <CardHeader>
              <h4 className="text-xl font-semibold text-white">Forus-Intelligence Pro</h4>
              <p className="text-gray-200">Our exclusive AI model</p>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300">Custom-trained for optimal performance and specialized tasks</p>
            </CardContent>
          </Card>
          
          <Card className="border-white/20 bg-gradient-to-br from-gray-700/60 to-gray-800/40 backdrop-blur-sm">
            <CardHeader>
              <h4 className="text-xl font-semibold text-white">Forus-Intelligence Lite</h4>
              <p className="text-gray-200">Fast & efficient AI</p>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300">Optimized for quick responses and everyday conversations</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-gray-200 via-gray-400 to-gray-200 py-20">
        <div className="container mx-auto px-6 text-center">
          <h3 className="text-4xl font-bold text-white mb-4">
            Ready to Get Started?
          </h3>
          <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
            Join thousands of users already experiencing the future of AI conversations
          </p>
          <Button 
            onClick={handleGetStarted}
            size="lg"
            className="bg-white text-black hover:bg-gray-100 px-8 py-4 text-lg rounded-xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
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
              <div className="w-8 h-8 bg-gradient-to-br from-white to-black rounded-lg flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <h4 className="text-2xl font-bold">Forus Heavy API</h4>
            </div>
            <p className="text-gray-400 mb-6">
              The future of AI conversations, today.
            </p>
            <p className="text-gray-500 text-sm">
              © 2025 Forus Heavy API. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}