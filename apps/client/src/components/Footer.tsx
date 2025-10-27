import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="text-center space-y-2 text-gray-600 pb-6 sm:pb-8 mt-12 border-t border-gray-200 pt-8">
      <div className="text-sm">
        <span>© {new Date().getFullYear()} ZST ecom. All rights reserved.</span>
        <span className="mx-2">|</span>
        <Link href="#" className="hover:text-black transition-colors">
          Privacy Policy
        </Link>
        <span className="mx-2">|</span>
        <Link href="#" className="hover:text-black transition-colors">
          Terms of Service
        </Link>
      </div>
    </footer>
  );
}
