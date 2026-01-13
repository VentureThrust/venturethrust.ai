'use client';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, FolderKanban, Scale, FileQuestion, Clock, Lock, Fingerprint, DatabaseZap, ShieldCheck, FolderSync, BarChart, FileWarning } from 'lucide-react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Link from 'next/link';

function HeroSection() {
  return (
    <section className="py-20 sm:py-24 lg:py-32">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl font-headline animate-in fade-in slide-in-from-bottom-4 duration-1000">
          The Clear Path to Smarter Startup Investing.
        </h1>
        <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
          Venture Trust is a secure, centralized platform for founders and investors to manage documents, identify red flags, and make decisions with confidence.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-x-6 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-400">
          <Button size="lg" className="w-full sm:w-auto" asChild>
            <Link href="/signup">Get Started</Link>
          </Button>
          <Button size="lg" variant="outline" className="w-full sm:w-auto" asChild>
            <a href="#how-it-works">How It Works</a>
          </Button>
        </div>
      </div>
    </section>
  );
}

const problems = [
    {
      icon: FolderSync,
      title: 'Scattered Documents',
      description: 'Key files are spread across emails, cloud drives, and local storage, creating chaos.',
    },
    {
      icon: Clock,
      title: 'Manual Review Cycles',
      description: 'Hours are wasted manually sifting through documents to find critical information.',
    },
    {
      icon: FileWarning,
      title: 'Hidden Risks',
      description: 'Subtle red flags in legal and financial documents are easily missed, leading to bad investments.',
    },
    {
      icon: BarChart,
      title: 'Lack of Insight',
      description: 'It’s difficult to get a high-level view of a startup’s health and risk profile quickly.',
    },
  ];

function ProblemSection() {
  return (
    <section className="py-20 sm:py-24 lg:py-32 bg-card">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl font-headline">
            Investment due diligence is messy.
          </h2>
          <p className="mt-4 text-lg leading-8 text-muted-foreground">
            Scattered files, endless emails, and missed details slow down deals and increase risk.
          </p>
        </div>
        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {problems.map((problem, i) => (
            <div key={problem.title} className="p-6 bg-background/50 rounded-lg shadow-sm animate-in fade-in slide-in-from-bottom-6 duration-1000" style={{ animationDelay: `${i * 100}ms` }}>
              <problem.icon className="h-10 w-10 text-primary" />
              <h3 className="mt-6 text-lg font-semibold text-foreground">{problem.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{problem.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const investorFeatures = [
    'Centralize all startup documents in one secure, organized data room.',
    'Automatically scan documents for legal, financial, and compliance red flags.',
    'Get a high-level risk score and detailed analysis for faster decision-making.',
    'Track document views and activity to gauge investor interest.',
    'Collaborate with your team, leaving comments and tasks on specific documents.',
    'Generate comprehensive due diligence reports with a single click.',
  ];
  
  const founderFeatures = [
    'Build a professional, investor-ready data room in minutes.',
    'Control access with granular permissions and see who has viewed your files.',
    'Identify and fix potential issues before sharing with investors.',
    'Present your company professionally and transparently to build trust.',
    'Streamline the fundraising process and reduce back-and-forth emails.',
    'Spend less time managing documents and more time building your business.',
  ];

function FeatureGrid({ features }: { features: any[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
      {features.map((feature, index) => (
        <div key={index} className="flex items-start gap-3 animate-in fade-in" style={{ animationDelay: `${index * 100}ms` }}>
          <CheckCircle className="h-5 w-5 text-accent mt-1 flex-shrink-0" />
          <p className="text-foreground">{feature}</p>
        </div>
      ))}
    </div>
  );
}

function SolutionSection() {
  return (
    <section id="features" className="py-20 sm:py-24 lg:py-32">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl font-headline">
            A Single Source of Truth for Due Diligence.
          </h2>
          <p className="mt-4 text-lg leading-8 text-muted-foreground">
            Venture Trust brings structure and clarity to the investment process for everyone involved.
          </p>
        </div>
        <div className="mt-16">
          <Tabs defaultValue="investors" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
              <TabsTrigger value="investors">For Investors</TabsTrigger>
              <TabsTrigger value="founders">For Founders</TabsTrigger>
            </TabsList>
            <TabsContent value="investors" className="mt-12">
              <FeatureGrid features={investorFeatures} />
            </TabsContent>
            <TabsContent value="founders" className="mt-12">
              <FeatureGrid features={founderFeatures} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  );
}

const steps = [
    {
      name: '1. Create Data Room',
      description: 'Founders easily upload all relevant documents into a secure, structured virtual data room.',
    },
    {
      name: '2. Invite & Analyze',
      description: 'Investors are invited to the data room. Our AI automatically scans documents for red flags and key insights.',
    },
    {
      name: '3. Review & Collaborate',
      description: 'Investors review the AI-generated analysis, view risk scores, and collaborate with their team directly on the platform.',
    },
    {
      name: '4. Make Informed Decisions',
      description: 'With a clear, comprehensive overview, investors can make faster, more confident funding decisions.',
    },
  ];

const productUiImage = PlaceHolderImages.find(img => img.id === 'product-ui');

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 sm:py-24 lg:py-32 bg-card">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl font-headline">Clarity in Four Steps.</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              We streamline the entire due diligence process, from initial upload to final decision.
            </p>
            <dl className="mt-12 space-y-10">
              {steps.map((step) => (
                <div key={step.name} className="relative">
                   <dt className="text-base font-semibold leading-7 text-foreground">
                     {step.name}
                   </dt>
                   <dd className="mt-2 text-base leading-7 text-muted-foreground">{step.description}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="bg-background/50 p-2 rounded-lg shadow-lg -m-4">
            {productUiImage && (
              <Image
                src={productUiImage.imageUrl}
                alt={productUiImage.description}
                data-ai-hint={productUiImage.imageHint}
                width={1200}
                height={750}
                className="rounded-md"
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

const securityFeatures = [
    {
      icon: ShieldCheck,
      title: 'End-to-End Encryption',
      description: 'Your data is encrypted in transit and at rest using industry-leading AES-256 standards.',
    },
    {
      icon: Lock,
      title: 'Granular Permissions',
      description: 'Control exactly who sees what with document-level and user-level access controls.',
    },
    {
      icon: Fingerprint,
      title: 'Audit Trails',
      description: 'Maintain a complete, immutable log of all activity within your data room for compliance.',
    },
    {
      icon: DatabaseZap,
      title: 'Secure Infrastructure',
      description: 'Built on top of Google Cloud Platform for world-class reliability and security.',
    },
  ];

function TrustSection() {
  return (
    <section id="security" className="py-20 sm:py-24 lg:py-32">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl font-headline">
            Built for Your Most Sensitive Data.
          </h2>
          <p className="mt-4 text-lg leading-8 text-muted-foreground">
            Security isn't an afterthought; it's our foundation.
          </p>
        </div>
        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {securityFeatures.map((feature) => (
            <div key={feature.title} className="text-center p-6">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <feature.icon className="h-6 w-6 text-primary" aria-hidden="true" />
              </div>
              <h3 className="mt-6 text-lg font-semibold text-foreground">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaSection() {
  return (
    <section className="py-20 sm:py-24 lg:py-32 bg-card">
      <div className="container mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl font-headline">
          Ready to bring clarity to your process?
        </h2>
        <p className="mt-4 text-lg leading-8 text-muted-foreground">
          Get started with Venture Trust today and experience a calmer, more confident way to invest.
        </p>
        <div className="mt-10">
          <Button size="lg" asChild>
            <Link href="/signup">Get Started Free</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <ProblemSection />
        <SolutionSection />
        <HowItWorksSection />
        <TrustSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}
