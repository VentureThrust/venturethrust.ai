import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white text-gray-900">
      <Header />
      <main className="container mx-auto max-w-4xl px-6 pb-24 pt-10">{children}</main>
      <Footer />
    </div>
  );
}
