"use client";

import { useEffect, useRef, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type Mode = "ios" | "android" | null;
type IosScreen = "select" | "safari" | "chrome";

const STORAGE_KEY = "pwa-install-dismissed";

function detectEnv() {
  const standalone = window.matchMedia("(display-mode: standalone)").matches;
  const ua = navigator.userAgent;
  const ios = /iphone|ipad/i.test(ua);
  return { standalone, ios };
}

export function InstallPrompt() {
  const [mode, setMode] = useState<Mode>(null);
  const [iosScreen, setIosScreen] = useState<IosScreen>("select");
  const [visible, setVisible] = useState(false);
  const promptRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return;

    const { standalone, ios } = detectEnv();
    if (standalone) return;

    if (ios) {
      const timer = setTimeout(() => setMode("ios"), 1500);
      return () => clearTimeout(timer);
    }

    let showTimer: ReturnType<typeof setTimeout>;
    const handler = (e: Event) => {
      e.preventDefault();
      promptRef.current = e as BeforeInstallPromptEvent;
      showTimer = setTimeout(() => setMode("android"), 1500);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(showTimer);
    };
  }, []);

  useEffect(() => {
    if (!mode) return;
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, [mode]);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, "1");
    setTimeout(() => {
      setMode(null);
      setIosScreen("select");
    }, 300);
  };

  const installAndroid = async () => {
    const prompt = promptRef.current;
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    promptRef.current = null;
    if (outcome === "accepted") dismiss();
    else setMode(null);
  };

  if (!mode) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40 transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
        onClick={dismiss}
      />

      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl px-6 pt-5 shadow-2xl transition-transform duration-300"
        style={{
          transform: visible ? "translateY(0)" : "translateY(100%)",
          paddingBottom: "max(2rem, env(safe-area-inset-bottom))",
        }}
      >
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />

        {mode === "ios" ? (
          <IosContent
            screen={iosScreen}
            onSelectBrowser={setIosScreen}
            onBack={() => setIosScreen("select")}
            onDismiss={dismiss}
          />
        ) : (
          <AndroidContent onInstall={installAndroid} onDismiss={dismiss} />
        )}
      </div>
    </>
  );
}

function IosContent({
  screen,
  onSelectBrowser,
  onBack,
  onDismiss,
}: {
  screen: IosScreen;
  onSelectBrowser: (b: "safari" | "chrome") => void;
  onBack: () => void;
  onDismiss: () => void;
}) {
  if (screen === "select") {
    return (
      <>
        <h2 className="text-lg font-bold text-foreground mb-1">アプリとして使えます</h2>
        <p className="text-sm text-muted-foreground mb-6">
          ホーム画面に追加すると、アイコンひとつでいつでもクラブの情報を確認できます。ご利用のブラウザを選んでください。
        </p>
        <div className="flex gap-3 mb-4">
          <button
            onClick={() => onSelectBrowser("safari")}
            className="flex-1 py-4 rounded-xl border border-border bg-secondary/50 active:bg-secondary text-sm font-medium text-foreground"
          >
            Safari
          </button>
          <button
            onClick={() => onSelectBrowser("chrome")}
            className="flex-1 py-4 rounded-xl border border-border bg-secondary/50 active:bg-secondary text-sm font-medium text-foreground"
          >
            Chrome
          </button>
        </div>
        <button onClick={onDismiss} className="w-full py-3 text-sm text-muted-foreground">
          あとで
        </button>
      </>
    );
  }

  const isSafari = screen === "safari";
  const steps = isSafari
    ? [
        <> 画面下部の<DotsIcon />をタップ</>,
        <>「<ShareIcon />共有」をタップ</>,
        <>「表示数を増やす」をタップ</>,
        <>「ホーム画面に追加」をタップ</>,
      ]
    : [
        <>画面上部の検索バー内の <ShareIcon /> をタップ</>,
        <>「表示数を増やす」をタップ</>,
        <>「ホーム画面に追加」をタップ</>,
      ];

  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={onBack}
          className="p-1 -ml-1 text-muted-foreground"
          aria-label="戻る"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className="text-sm text-muted-foreground">{isSafari ? "Safari" : "Chrome"}</span>
      </div>

      <h2 className="text-lg font-bold text-foreground mb-1">ホーム画面に追加</h2>
      <p className="text-sm text-muted-foreground mb-6">アプリのようにすぐ開けます</p>

      <ol className="space-y-5 mb-6">
        {steps.map((step, i) => (
          <li key={i} className="flex items-start gap-3">
            <StepBadge n={i + 1} />
            <p className="text-sm text-foreground pt-0.5">{step}</p>
          </li>
        ))}
      </ol>

      <button onClick={onDismiss} className="w-full py-3 text-sm text-muted-foreground">
        あとで
      </button>
    </>
  );
}

function AndroidContent({
  onInstall,
  onDismiss,
}: {
  onInstall: () => void;
  onDismiss: () => void;
}) {
  return (
    <>
      <h2 className="text-lg font-bold text-foreground mb-1">ホーム画面に追加</h2>
      <p className="text-sm text-muted-foreground mb-6">アプリのようにすぐ開けます</p>
      <button
        onClick={onInstall}
        className="w-full py-3.5 mb-2 rounded-xl bg-primary text-primary-foreground font-medium text-sm"
      >
        ホーム画面に追加する
      </button>
      <button onClick={onDismiss} className="w-full py-3 text-sm text-muted-foreground">
        あとで
      </button>
    </>
  );
}

function StepBadge({ n }: { n: number }) {
  return (
    <span className="flex-none w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
      {n}
    </span>
  );
}

function DotsIcon() {
  return (
    <svg
      className="inline-block w-[18px] h-[18px] mx-0.5 -mt-0.5 text-muted-foreground"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg
      className="inline-block w-[18px] h-[18px] mx-0.5 -mt-0.5 text-primary"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}
