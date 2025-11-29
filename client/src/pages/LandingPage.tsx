import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { MapPin, Calendar, Users, Route, Bell, Archive, CheckCircle2, ArrowRight } from "lucide-react";

export default function LandingPage() {
  const features = [
    {
      icon: Route,
      title: "Smart Route Planning",
      description: "Plan efficient routes with multiple stops. Optimize your day and save time on the road.",
    },
    {
      icon: Users,
      title: "Contact Management",
      description: "Sync your Google Contacts and organize them with labels. Keep everyone in your kangaroo crew organized.",
    },
    {
      icon: Calendar,
      title: "Calendar Integration",
      description: "Connect your Google Calendar and see your scheduled routes alongside your events.",
    },
    {
      icon: Bell,
      title: "Smart Reminders",
      description: "Never miss an important date. Get reminders for birthdays, anniversaries, and custom dates.",
    },
    {
      icon: MapPin,
      title: "Address Tracking",
      description: "Track address changes and keep your contact information up-to-date automatically.",
    },
    {
      icon: Archive,
      title: "Route History",
      description: "Archive completed routes and review your past journeys. Learn from your routing patterns.",
    },
  ];

  const benefits = [
    "Save hours every week with optimized routing",
    "Never forget important client dates",
    "Keep your contact database fresh and accurate",
    "Plan routes for specific dates or on-the-fly",
    "Access from anywhere with cloud sync",
    "Free to use - no credit card required",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={APP_LOGO} alt="Routie Roo" className="h-12 w-12" />
            <h1 className="text-2xl font-bold text-blue-600">{APP_TITLE}</h1>
          </div>
          <Button asChild>
            <a href={getLoginUrl()}>
              Sign In
            </a>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <img 
            src={APP_LOGO} 
            alt="Routie Roo Kangaroo" 
            className="h-32 w-32 mx-auto mb-8 animate-bounce"
          />
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Hop Through Your Day with Smart Route Planning
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Your friendly route planning companion for sales reps, healthcare workers, 
            service professionals, and anyone who needs to visit multiple locations efficiently.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="text-lg px-8">
              <a href={getLoginUrl()}>
                <Users className="mr-2 h-5 w-5" />
                Get Started Free
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-lg px-8">
              <a href="#features">
                Learn More
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="container mx-auto px-4 py-20 bg-white">
        <div className="text-center mb-16">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            Everything You Need to Stay Organized
          </h3>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Routie Roo combines route planning, contact management, and calendar integration 
            into one friendly platform.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <Card key={index} className="border-2 hover:border-blue-300 transition-colors">
              <CardContent className="pt-6">
                <feature.icon className="h-12 w-12 text-blue-600 mb-4" />
                <h4 className="text-xl font-semibold mb-2">{feature.title}</h4>
                <p className="text-gray-600">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose Routie Roo?
            </h3>
            <p className="text-lg text-gray-600">
              Join professionals who are already hopping smarter, not harder.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                <p className="text-lg text-gray-700">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl text-white text-center my-20">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-4xl font-bold mb-6">
            Ready to Start Hopping?
          </h3>
          <p className="text-xl mb-8 opacity-90">
            Sign up with your Google account and start planning smarter routes today. 
            No credit card required, no setup fees, just pure route planning goodness.
          </p>
          <Button size="lg" variant="secondary" asChild className="text-lg px-8">
            <a href={getLoginUrl()}>
              <Users className="mr-2 h-5 w-5" />
              Sign Up with Google
            </a>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src={APP_LOGO} alt="Routie Roo" className="h-8 w-8" />
              <p className="text-gray-600">
                © 2025 {APP_TITLE}. Hop smarter, not harder.
              </p>
            </div>
            <div className="flex gap-6 text-sm text-gray-600">
              <a href="#features" className="hover:text-blue-600 transition-colors">
                Features
              </a>
              <a href={getLoginUrl()} className="hover:text-blue-600 transition-colors">
                Sign In
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
