import { POWERED_BY } from "../../constants/appConfig";

export default function Footer({ className = "" }) {
  return (
    <footer className={`py-3 px-4 text-center text-xs text-slate-400 border-t border-slate-200/60 bg-white/50 backdrop-blur-xs select-none mt-auto ${className}`}>
      {POWERED_BY}
    </footer>
  );
}
