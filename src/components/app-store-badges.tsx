import playStoreBadge from "@/assets/play-store-badge.svg";
import appStoreBadge from "@/assets/app-store-badge.svg";
import { Download } from "lucide-react";

let exeDownloadUrl = "";

export function setExeDownloadUrl(url: string) {
  exeDownloadUrl = url;
}

export function getExeDownloadUrl() {
  return exeDownloadUrl;
}

function notReady() {
  alert("App not ready for this platform — coming soon.");
}

interface Props {
  compact?: boolean;
}

export default function AppStoreBadges({ compact }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <a
        href="https://github.com/namandisafari-sketch/habico-ug/releases/download/v1.3.0/Habico-v1.3.0.apk"
        download
        className="cursor-pointer transition-opacity hover:opacity-80 active:scale-[0.97]"
      >
        <img src={playStoreBadge} alt="Get it on Google Play" className={compact ? "h-9 w-auto" : "h-12 w-auto"} />
      </a>
      <button
        type="button"
        onClick={notReady}
        className="cursor-pointer transition-opacity hover:opacity-80 active:scale-[0.97]"
      >
        <img src={appStoreBadge} alt="Download on the App Store" className={compact ? "h-9 w-auto" : "h-12 w-auto"} />
      </button>
      {exeDownloadUrl && (
        <a
          href={exeDownloadUrl}
          download
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#0078D4] px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 active:scale-[0.97]"
          style={{ height: compact ? 36 : 48 }}
        >
          <Download className="h-4 w-4" />
          Windows
        </a>
      )}
    </div>
  );
}
