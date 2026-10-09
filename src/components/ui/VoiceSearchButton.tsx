import { useEffect, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceSearchButtonProps {
  onResult: (transcript: string) => void;
  className?: string;
  /** BCP-47 language tag passed to the recognizer. Defaults to browser locale. */
  lang?: string;
}

// Web Speech API types aren't in lib.dom.d.ts across all TS configs here, so
// this reaches into the browser global dynamically rather than importing types.
function getSpeechRecognitionCtor(): any {
  if (typeof window === "undefined") return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

/**
 * Mic button that dictates into whatever search box it's paired with via
 * `onResult`. Feature-detects the Web Speech API (Safari/Firefox desktop
 * don't support it) and disables itself rather than throwing when absent.
 */
export function VoiceSearchButton({ onResult, className, lang }: VoiceSearchButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    setIsSupported(!!getSpeechRecognitionCtor());
  }, []);

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop();
      } catch {
        // no-op — recognizer may already be stopped/aborted
      }
    };
  }, []);

  const handleClick = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognitionCtor = getSpeechRecognitionCtor();
    if (!SpeechRecognitionCtor) return;

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = lang || navigator.language || "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript || "";
      if (transcript) onResult(transcript.trim());
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  };

  if (!isSupported) return null;

  return (
    <button
      type="button"
      onClick={handleClick}
      title={isListening ? "Stop voice search" : "Search by voice"}
      aria-label={isListening ? "Stop voice search" : "Search by voice"}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-xl p-1.5 transition",
        isListening
          ? "bg-red-500 text-white shadow-md shadow-red-500/30 animate-pulse"
          : "text-slate-400 hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-slate-800 dark:hover:text-blue-400",
        className
      )}
    >
      {isListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
    </button>
  );
}
