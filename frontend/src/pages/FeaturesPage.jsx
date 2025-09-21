import { Link } from "react-router";
import { ArrowLeftIcon, MessageSquareIcon, ShieldCheckIcon, ZapIcon, GlobeIcon, UsersIcon, HeartIcon, SparklesIcon } from "lucide-react";

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="w-full py-6 border-b border-slate-700/60">
        <div className="max-w-4xl mx-auto px-4 flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Home
          </Link>
          <div className="flex items-center gap-2">
            <SparklesIcon className="w-6 h-6 text-cyan-400" />
            <h1 className="text-xl font-bold text-slate-100">Features</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="w-full py-16">
        <div className="max-w-6xl mx-auto px-4">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-300 mb-6">
              <SparklesIcon className="w-4 h-4" />
              Powerful features for global communication
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-100 mb-6">
              Everything You Need to
              <span className="block bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Connect Globally
              </span>
            </h2>
            <p className="text-slate-300 text-xl max-w-3xl mx-auto leading-relaxed">
              Discover all the features that make Lingua Link the most powerful real-time translation platform for global communication.
            </p>
          </div>

          {/* Main Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            <FeatureCard
              icon={<MessageSquareIcon className="w-8 h-8" />}
              title="Real-Time Translation"
              description="Instant message translation in 100+ languages with context-aware AI that understands nuance and cultural references."
              features={["100+ languages supported", "Context-aware translations", "Instant processing", "Cultural nuance detection"]}
              gradient="from-cyan-500 to-blue-500"
            />

            <FeatureCard
              icon={<ShieldCheckIcon className="w-8 h-8" />}
              title="Privacy First"
              description="Your conversations stay private with end-to-end encryption and zero message storage on our servers."
              features={["End-to-end encryption", "No message storage", "GDPR compliant", "Anonymous usage"]}
              gradient="from-green-500 to-emerald-500"
            />

            <FeatureCard
              icon={<ZapIcon className="w-8 h-8" />}
              title="Lightning Fast"
              description="Sub-second translation speeds that feel instant, powered by advanced AI and optimized infrastructure."
              features={["Sub-second response", "Global CDN", "Smart caching", "Optimized processing"]}
              gradient="from-yellow-500 to-orange-500"
            />

            <FeatureCard
              icon={<GlobeIcon className="w-8 h-8" />}
              title="Universal Access"
              description="Works on any device, anywhere in the world. No downloads required - just open your browser and start chatting."
              features={["Web-based platform", "Mobile responsive", "Cross-platform", "No installation needed"]}
              gradient="from-purple-500 to-pink-500"
            />

            <FeatureCard
              icon={<UsersIcon className="w-8 h-8" />}
              title="Group Conversations"
              description="Chat with multiple people in different languages simultaneously. Everyone sees messages in their preferred language."
              features={["Multi-language groups", "Real-time for all", "Smart language detection", "Seamless experience"]}
              gradient="from-indigo-500 to-purple-500"
            />

            <FeatureCard
              icon={<HeartIcon className="w-8 h-8" />}
              title="Personal Focus"
              description="Designed for real relationships - family, friends, and meaningful connections. Not another social network."
              features={["Family-friendly", "Personal messaging", "Relationship-focused", "Authentic connections"]}
              gradient="from-pink-500 to-rose-500"
            />
          </div>

          {/* CTA Section */}
          <div className="text-center rounded-2xl border border-slate-700/60 bg-slate-800/40 p-12">
            <h3 className="text-3xl font-bold text-slate-100 mb-4">
              Ready to Break Down Language Barriers?
            </h3>
            <p className="text-slate-300 text-lg mb-8 max-w-2xl mx-auto">
              Join thousands of users who are already breaking down language barriers and connecting globally with Lingua Link.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-medium hover:opacity-90 transition-opacity"
              >
                <MessageSquareIcon className="w-5 h-5" />
                Start Chatting Now
              </Link>
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-lg border border-slate-600 text-slate-300 hover:text-white hover:border-slate-500 transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5" />
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function FeatureCard({ icon, title, description, features, gradient }) {
  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-6 hover:bg-slate-700/40 transition-all duration-300 hover:scale-105">
      <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${gradient} flex items-center justify-center text-white mb-4`}>
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-slate-100 mb-3">{title}</h3>
      <p className="text-slate-300 text-sm leading-relaxed mb-4">{description}</p>
      <ul className="space-y-2">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center gap-2 text-slate-400 text-sm">
            <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full flex-shrink-0"></div>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}