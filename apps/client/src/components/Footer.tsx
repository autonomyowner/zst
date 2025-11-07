import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="text-center space-y-2 text-gray-600 pb-4 sm:pb-6 md:pb-8 mt-8 sm:mt-12 border-t border-gray-200 pt-6 sm:pt-8 px-2 sm:px-4">
      <div className="text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 flex-wrap">
        <span>© {new Date().getFullYear()} ZST ecom. All rights reserved.</span>
        <span className="hidden sm:inline mx-2">|</span>
        <Link href="#" className="hover:text-black transition-colors min-h-[44px] inline-flex items-center">
          Privacy Policy
        </Link>
        <span className="hidden sm:inline mx-2">|</span>
        <Link href="#" className="hover:text-black transition-colors min-h-[44px] inline-flex items-center">
          Terms of Service
        </Link>
      </div>
    </footer>
  );
}
