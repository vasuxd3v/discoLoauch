"use client";

import Navbar from "@/components/Navbar";
import FeatureCard from "@/components/FeatureCard";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";

export default function Home() {
  const featuresRef = useRef(null);

  const scrollToFeatures = () => {
    if (featuresRef.current) {
      featuresRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Navbar */}
      <Navbar />

      {/* Hero Section with CTA Buttons */}
      <section className="pt-28 pb-16 md:pt-36 md:pb-24 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-blue-500 to-indigo-600 text-transparent bg-clip-text">
            Automate Your Social Media Presence
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-10">
            Powerful automation tools to enhance your online communication and
            engagement. Save time and increase productivity with our suite of
            intelligent assistants.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={scrollToFeatures}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg transition-colors shadow-lg hover:shadow-xl"
            >
              Get Started
            </button>
            <Link
              href="/learn-more"
              className="bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-600 dark:text-blue-400 font-medium py-3 px-8 rounded-lg border border-blue-200 dark:border-gray-600 transition-colors shadow-md hover:shadow-lg"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section
        ref={featuresRef}
        className="py-12 px-6 bg-gray-100 dark:bg-gray-800 transition-colors scroll-mt-20"
      >
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800 dark:text-gray-100">
            Our Powerful Tools
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              title="Auto Messager"
              description="Schedule and send automated messages across multiple platforms. Perfect for marketing campaigns and regular updates."
              icon={
                <svg
                  className="w-8 h-8"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"></path>
                </svg>
              }
              toolPath="/tools/auto-messager"
            />

            <FeatureCard
              title="Auto Replier"
              description="Intelligent response system that handles common inquiries. Train it with your FAQs and let it handle the routine conversations."
              icon={
                <svg
                  className="w-8 h-8"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"></path>
                </svg>
              }
              toolPath="/tools/auto-replier"
            />

            <FeatureCard
              title="Auto DM Reply"
              description="Never miss a direct message again. Set up automatic replies for your DMs when you're away or busy with other tasks."
              icon={
                <svg
                  className="w-8 h-8"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6zm-2 0l-8 5-8-5h16zm0 12H4V8l8 5 8-5v10z"></path>
                </svg>
              }
              toolPath="/tools/auto-dm-reply"
            />
          </div>
        </div>
      </section>
    </main>
  );
}
