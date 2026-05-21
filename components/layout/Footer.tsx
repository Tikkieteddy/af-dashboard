export default function Footer() {
  return (
    <footer className="mt-10 pt-6 pb-6 border-t border-gray-100">
      <p className="text-[11px] lg:text-xs text-center text-af-gray-dark leading-relaxed px-4">
        <span className="font-medium text-af-navy">TrueAF</span>
        <span className="mx-1.5">·</span>
        Dashboard
        <span className="mx-1.5">·</span>
        © {new Date().getFullYear()} True Corporation Public Company Limited
        All rights reserved.
        <span className="mx-1.5 hidden sm:inline">·</span>
        <br className="sm:hidden" />
        <span className="text-af-gray-dark">
          Powered by TNN Digital Media &amp; AI Team
          <span className="mx-1">|</span>
          <span className="text-af-pink font-medium">TikkieTeddie Lab</span>
        </span>
      </p>
    </footer>
  );
}
