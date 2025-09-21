import { Link } from "react-router";
import { ArrowLeftIcon, ShieldCheckIcon, EyeOffIcon, LockIcon, UserCheckIcon } from "lucide-react";

export default function PrivacyPage() {
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
            <ShieldCheckIcon className="w-6 h-6 text-cyan-400" />
            <h1 className="text-xl font-bold text-slate-100">Privacy Policy</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="w-full py-16">
        <div className="max-w-4xl mx-auto px-4">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm text-green-300 mb-6">
              <ShieldCheckIcon className="w-4 h-4" />
              Your privacy is our priority
            </div>
            <h2 className="text-4xl font-bold text-slate-100 mb-6">
              Privacy Policy
            </h2>
            <p className="text-slate-300 text-lg max-w-2xl mx-auto leading-relaxed">
              We believe your conversations should stay private. Here's exactly how we protect your data and respect your privacy.
            </p>
          </div>

          {/* Privacy Principles */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-6">
              <EyeOffIcon className="w-8 h-8 text-cyan-400 mb-4" />
              <h3 className="text-xl font-semibold text-slate-100 mb-3">No Message Storage</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                We don't store your personal conversations. Messages are processed for translation and immediately discarded. Your chats stay between you and your friends.
              </p>
            </div>
            <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-6">
              <LockIcon className="w-8 h-8 text-purple-400 mb-4" />
              <h3 className="text-xl font-semibold text-slate-100 mb-3">Secure Processing</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                All translations happen through encrypted connections. Your messages are protected in transit and never stored on our servers.
              </p>
            </div>
            <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-6">
              <UserCheckIcon className="w-8 h-8 text-green-400 mb-4" />
              <h3 className="text-xl font-semibold text-slate-100 mb-3">Your Control</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                You control your data. Delete your account anytime and all associated data is permanently removed. No hidden retention periods.
              </p>
            </div>
            <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-6">
              <ShieldCheckIcon className="w-8 h-8 text-pink-400 mb-4" />
              <h3 className="text-xl font-semibold text-slate-100 mb-3">GDPR Compliant</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                We follow strict European privacy standards. Your rights are protected regardless of where you live.
              </p>
            </div>
          </div>

          {/* Back to Home CTA */}
          <div className="text-center mt-12">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-medium hover:opacity-90 transition-opacity"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Back to Lingua Link
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}