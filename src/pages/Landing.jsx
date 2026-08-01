/**
 * Landing Page Component
 * 
 * Purpose:
 * Public marketing landing page introducing Placemints value proposition to SASTRA University students.
 * Includes feature breakdown, company ecosystem overview, call to action, and footer.
 * 
 * Future Backend Integration:
 * Static marketing content; requires no backend API connection.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  FileCode2, 
  BookmarkCheck, 
  GraduationCap, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles,
  Search,
  BookOpen
} from 'lucide-react';
import { Button } from '../components/Button';
import { Footer } from '../components/Footer';
import { ROUTES } from '../constants/routes';

export function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-brand-100 selection:text-brand-700">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(ROUTES.HOME)}>
            <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-subtle">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="font-bold text-slate-900 text-xl tracking-tight">Placemints</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(ROUTES.LOGIN)}
              className="text-sm font-extrabold text-slate-800 hover:text-brand-600 px-3.5 py-2 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Sign In
            </button>
            <Button variant="primary" size="sm" onClick={() => navigate(ROUTES.LOGIN)}>
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
          {/* Tagline Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-xs font-semibold text-brand-700 mb-6 shadow-subtle">
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            <span>Built exclusively for SASTRA University Students</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15] mb-6">
            Placement preparation, <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-brand-600 to-indigo-600 bg-clip-text text-transparent">
              built with precision.
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto mb-8 leading-relaxed">
            Access company-wise selection rounds, verified past year questions (PYQs), tailored preparation resources, and keep your target companies organized in your personal library.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              variant="primary" 
              size="lg" 
              onClick={() => navigate(ROUTES.LOGIN)}
              className="w-full sm:w-auto text-base px-8 py-3.5 shadow-md"
            >
              <span>Explore Directory</span>
              <ArrowRight className="w-5 h-5 ml-1" />
            </Button>

            <Button 
              variant="secondary" 
              size="lg" 
              onClick={() => navigate(ROUTES.LOGIN)}
              className="w-full sm:w-auto text-base px-8 py-3.5"
            >
              Sign In with Google
            </Button>
          </div>

          {/* Quick Stat Badges */}
          <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto text-left">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card">
              <div className="text-2xl font-extrabold text-brand-600">50+</div>
              <div className="text-xs text-slate-500 font-medium">Recruiting Companies</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card">
              <div className="text-2xl font-extrabold text-emerald-600">200+</div>
              <div className="text-xs text-slate-500 font-medium">Verified Campus PYQs</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card">
              <div className="text-2xl font-extrabold text-indigo-600">100%</div>
              <div className="text-xs text-slate-500 font-medium">SASTRA Specific</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card">
              <div className="text-2xl font-extrabold text-slate-800">Free</div>
              <div className="text-xs text-slate-500 font-medium">For All Batches</div>
            </div>
          </div>
        </section>

        {/* Feature Highlights Grid */}
        <section id="features" className="py-16 bg-white border-y border-slate-200 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-3">
                Everything you need to ace your campus placement
              </h2>
              <p className="text-sm text-slate-500">
                Stop searching across random drives and WhatsApp groups. Everything is structured in one clean workspace.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Feature 1 */}
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 hover:border-brand-200 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-brand-100 border border-brand-200 flex items-center justify-center text-brand-700">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Company Directory</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Browse Product, Service, Dream, and Super Dream recruiters visiting SASTRA with detailed CTC breakdowns.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 hover:border-brand-200 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700">
                  <FileCode2 className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Company PYQs</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Practice authentic past year coding & technical questions categorized by difficulty and topic.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 hover:border-brand-200 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700">
                  <BookmarkCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Personal Library</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Bookmark target companies to track rounds, syllabus topics, and stay focused on your specific targets.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 hover:border-brand-200 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Curated Resources</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Direct links to DSA sheets, SQL quizes, System Design notes, and senior interview experience archives.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default Landing;
