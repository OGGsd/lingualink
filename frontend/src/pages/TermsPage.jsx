import { Link } from "react-router";
import { ArrowLeftIcon, FileTextIcon, CheckCircle2Icon, AlertTriangleIcon, ScaleIcon } from "lucide-react";

export default function TermsPage() {
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
            <FileTextIcon className="w-6 h-6 text-purple-400" />
            <h1 className="text-xl font-bold text-slate-100">Terms of Service</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="w-full py-16">
        <div className="max-w-4xl mx-auto px-4">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-sm text-purple-300 mb-6">
              <ScaleIcon className="w-4 h-4" />
              Clear, fair, and simple terms
            </div>
            <h2 className="text-4xl font-bold text-slate-100 mb-6">
              Terms of Service
            </h2>
            <p className="text-slate-300 text-lg max-w-2xl mx-auto leading-relaxed">
              We believe in transparency. Here are the clear, fair terms that govern your use of Lingua Link.
            </p>
          </div>

          {/* Key Points */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-6 text-center">
              <CheckCircle2Icon className="w-8 h-8 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-100 mb-2">Free to Use</h3>
              <p className="text-slate-300 text-sm">
                Core translation features are completely free. No hidden costs or surprise charges.
              </p>
            </div>
            <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-6 text-center">
              <AlertTriangleIcon className="w-8 h-8 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-100 mb-2">Use Responsibly</h3>
              <p className="text-slate-300 text-sm">
                Don't use our service for spam, harassment, or illegal activities. Be respectful.
              </p>
            </div>
            <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-6 text-center">
              <ScaleIcon className="w-8 h-8 text-cyan-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-100 mb-2">Your Rights</h3>
              <p className="text-slate-300 text-sm">
                You own your content. We just help translate it. Cancel anytime, no questions asked.
              </p>
            </div>
          </div>

          {/* Detailed Terms */}
          <div className="space-y-8">
            <section className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-6">
              <h3 className="text-2xl font-bold text-slate-100 mb-4">What We Provide</h3>
              <ul className="space-y-3 text-slate-300 text-sm">
                <li className="flex items-start gap-3">
                  <CheckCircle2Icon className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Real-time translation services for personal messaging</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2Icon className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Secure, encrypted communication channels</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2Icon className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Support for 100+ languages and counting</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2Icon className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>24/7 platform availability (99.9% uptime goal)</span>
                </li>
              </ul>
            </section>

            <section className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-6">
              <h3 className="text-2xl font-bold text-slate-100 mb-4">Your Responsibilities</h3>
              <div className="space-y-4 text-slate-300 text-sm">
                <div>
                  <h4 className="font-semibold text-slate-200 mb-2">Account Security</h4>
                  <p>Keep your login credentials secure. You're responsible for all activity on your account.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-200 mb-2">Respectful Use</h4>
                  <p>Don't use our service to harass, spam, or harm others. Treat everyone with respect.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-200 mb-2">Legal Compliance</h4>
                  <p>Follow all applicable laws and regulations when using our service.</p>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-6">
              <h3 className="text-2xl font-bold text-slate-100 mb-4">Service Availability</h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-4">
                We strive to keep Lingua Link available 24/7, but we can't guarantee 100% uptime. We may need to perform maintenance or updates that temporarily affect service availability.
              </p>
              <p className="text-slate-300 text-sm leading-relaxed">
                We'll do our best to notify you in advance of planned maintenance and minimize any disruptions.
              </p>
            </section>

            <section className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-6">
              <h3 className="text-2xl font-bold text-slate-100 mb-4">Limitation of Liability</h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-4">
                While we work hard to provide accurate translations, we can't guarantee 100% accuracy. Important communications should always be verified.
              </p>
              <p className="text-slate-300 text-sm leading-relaxed">
                We're not liable for any damages resulting from translation errors, service interruptions, or other issues beyond our reasonable control.
              </p>
            </section>

            <section className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-6">
              <h3 className="text-2xl font-bold text-slate-100 mb-4">Changes to Terms</h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-4">
                We may update these terms occasionally. We'll notify you of significant changes via email or through the app.
              </p>
              <div className="space-y-2 text-slate-300 text-sm">
                <p><strong className="text-slate-200">Last Updated:</strong> {new Date().toLocaleDateString()}</p>
                <p><strong className="text-slate-200">Effective Date:</strong> {new Date().toLocaleDateString()}</p>
              </div>
            </section>
          </div>

          {/* Contact Section */}
          <div className="mt-12 text-center rounded-xl border border-slate-700/60 bg-slate-800/40 p-8">
            <h3 className="text-xl font-bold text-slate-100 mb-4">Questions About These Terms?</h3>
            <p className="text-slate-300 text-sm leading-relaxed mb-6">
              We're here to help clarify anything that's unclear. Our legal team responds quickly to all inquiries.
            </p>
            <div className="space-y-2 text-slate-300 text-sm mb-6">
              <p><strong className="text-slate-200">Email:</strong> legal@lingualink.com</p>
              <p><strong className="text-slate-200">Response Time:</strong> Within 24 hours</p>
            </div>
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:opacity-90 transition-opacity"
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
