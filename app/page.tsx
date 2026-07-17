"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Brain, ChartBar, Clock, Lightbulb, ShieldCheck, Goal } from "lucide-react";

export default function HomePage() {
  const [year, setYear] = useState(2026);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);
  const features = [
    {
      icon: <Brain className="h-8 w-8 text-blue-600" />,
      title: "AI-Powered Feedback",
      description: "Get instant, detailed feedback on your responses to improve your skills.",
    },
    {
      icon: <ChartBar className="h-8 w-8 text-blue-600" />,
      title: "Performance Analytics",
      description: "Track your progress with detailed reports and visual analytics.",
    },
    {
      icon: <Clock className="h-8 w-8 text-blue-600" />,
      title: "Realistic Timers",
      description: "Practice under real interview conditions with timed questions.",
    },
    {
      icon: <Lightbulb className="h-8 w-8 text-blue-600" />,
      title: "Question Bank",
      description: "Access a vast library of interview questions across multiple domains.",
    },
    {
      icon: <ShieldCheck className="h-8 w-8 text-blue-600" />,
      title: "Privacy Focused",
      description: "Your data is secure and never shared with third parties.",
    },
    {
      icon: <Goal className="h-8 w-8 text-blue-600" />,
      title: "Goal Tracking",
      description: "Set goals and track your improvement over time.",
    },
  ];

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Hero Section */}
      <section className="px-4 py-20 lg:py-0 min-h-[calc(100vh-64px)] flex items-center">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full">
          <div className="text-center lg:text-left">
            <h1 className="text-4xl lg:text-5xl font-bold mb-6 text-gray-900">
              Ace Your Next Interview with AI
            </h1>
            <p className="text-lg lg:text-xl text-gray-600 mb-8 max-w-lg mx-auto lg:mx-0">
              Practice real-world interview questions, get instant feedback, and improve your skills with our AI-powered platform.
            </p>
            <Link href="/interview/create">
              <Button variant="default" size="lg">
                Start Free Interview
              </Button>
            </Link>
          </div>
          <div className="flex justify-center">
            <img
              src="/hero-image.png"
              alt="Interview preparation with AI"
              className="rounded-lg shadow-xl max-w-full h-auto"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-20 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">Why Choose InterviewIQ?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-gray-50 p-6 rounded-lg shadow-sm text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="px-4 py-20">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">What Our Users Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <p className="text-gray-700 italic mb-4">
                "InterviewIQ helped me land my dream job at FAANG! The AI feedback was incredibly detailed and helped me improve my responses."
              </p>
              <p className="font-medium text-gray-900">— Sarah K., Software Engineer</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <p className="text-gray-700 italic mb-4">
                "I was able to practice realistic interview scenarios and get instant feedback. My confidence improved significantly in just a week."
              </p>
              <p className="font-medium text-gray-900">— James T., Data Scientist</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <p className="text-gray-700 italic mb-4">
                "The performance analytics helped me identify my weak areas. I focused on improving them and aced my next interview."
              </p>
              <p className="font-medium text-gray-900">— Priya M., Product Manager</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6 text-gray-900">Ready to Ace Your Next Interview?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of users who have improved their interview skills with InterviewIQ.
          </p>
          <Link href="/interview/create">
            <Button variant="default" size="lg">
              Start Free Interview
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">InterviewIQ</h3>
              <p className="text-gray-400">
                Your AI-powered interview preparation partner.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/interview/create" className="hover:text-white">New Interview</a></li>
                <li><a href="#" className="hover:text-white">Features</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Guides</a></li>
                <li><a href="#" className="hover:text-white">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>© {year} InterviewIQ. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}