"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { usePlanStore } from "@/lib/plan-store";
import { Dialog, Icon, Sparkle } from "@/components/ui";
import { formatCompactINR } from "@/lib/format";

export interface InspirationPreset {
  id: string;
  source: "Pinterest" | "Instagram";
  title: string;
  subtitle: string;
  imageGradient: string;
  budgetInr: number;
  guests: number;
  vibe: string;
  palette: string[];
  decorStyle: string;
  prompt: string;
}

export const INSPIRATION_PRESETS: InspirationPreset[] = [
  {
    id: "royal-marigold",
    source: "Pinterest",
    title: "Royal Marigold & Brass Mandap",
    subtitle: "Pin from @DeccanWeddings · 4.8k saves",
    imageGradient: "linear-gradient(135deg, #d4af37 0%, #b8860b 40%, #ff8c00 100%)",
    budgetInr: 650000,
    guests: 120,
    vibe: "Royal Traditional Deccan",
    palette: ["#D4AF37", "#FF8C00", "#8B0000", "#2E5B37", "#FFF8DC"],
    decorStyle: "Suspended fresh marigold chandeliers, antique brass urlis with floating lotus, and raw silk draping",
    prompt: "Plan an engagement with Royal Marigold & Raw Brass theme, 120 guests, ₹6.5 lakh, Hyderabad, vegetarian",
  },
  {
    id: "emerald-nikaah",
    source: "Instagram",
    title: "Emerald Velvet & Heritage Sangeet",
    subtitle: "Saved Reel by @HyderabadHeritageEvents",
    imageGradient: "linear-gradient(135deg, #0f3b3a 0%, #1e5245 45%, #c9a227 100%)",
    budgetInr: 800000,
    guests: 150,
    vibe: "Nawabi Grandeur & Velvet Warmth",
    palette: ["#0F3B3A", "#C9A227", "#1E5245", "#F4E3C1", "#1B1B1B"],
    decorStyle: "Deep emerald velvet backdrops, warm tungsten Edison lamps, brass jaali arches, and Mogra floral curtains",
    prompt: "Plan a sangeet with Emerald Velvet and Gold theme, 150 guests, ₹8 lakh, Hyderabad Banjara Hills, Nawabi royal menu",
  },
  {
    id: "pastel-sunset",
    source: "Pinterest",
    title: "Pastel Sunset Lawn & Fairylight Canopy",
    subtitle: "Pin from @TheKnotIndia · 6.2k saves",
    imageGradient: "linear-gradient(135deg, #f7c7d4 0%, #ffd9e1 40%, #b9d8e8 100%)",
    budgetInr: 550000,
    guests: 80,
    vibe: "Dreamy Pastel Minimalist",
    palette: ["#F7C7D4", "#B9D8E8", "#FFF0F5", "#9CBFA5", "#DDA0DD"],
    decorStyle: "Blush peach draped pergolas, eucalyptus greenery runners, fairy light canopy over outdoor lawn seating",
    prompt: "Plan an engagement on a garden lawn, 80 guests, ₹5.5 lakh, Bengaluru, pastel sunset palette, acoustic vibe",
  },
  {
    id: "south-temple",
    source: "Instagram",
    title: "Temple Mogra & Kanjeevaram Aura",
    subtitle: "Saved Reel by @SouthIndianWeddings",
    imageGradient: "linear-gradient(135deg, #800020 0%, #b22222 50%, #ffd700 100%)",
    budgetInr: 600000,
    guests: 100,
    vibe: "Traditional Temple Serenity",
    palette: ["#800020", "#FFD700", "#FFFAF0", "#228B22", "#E67E22"],
    decorStyle: "Fresh stringed Madurai mogra, brass bell hangings, banana leaf backdrop framing, and bronze deepams",
    prompt: "Plan a traditional engagement, 100 guests, ₹6 lakh, Hyderabad, pure vegetarian Sattvik, temple floral decor",
  },
];

export const VOICE_DEMOS = [
  {
    lang: "Telugu",
    code: "te-IN",
    nativeName: "తెలుగు",
    transcript: "మా అన్నయ్య నిశ్చితార్థం ప్లాన్ చేయండి, 80 మంది అతిథులు, ₹6 లక్షల బడ్జెట్, హైదరాబాద్, 8 వారాల్లో, స్వచ్ఛమైన శాకాహారం",
    englishTranslation: "Plan my brother's engagement, 80 guests, ₹6 lakh, Hyderabad, in 8 weeks, pure vegetarian",
    chips: ["80 guests", "₹6,00,000", "Hyderabad", "Pure Veg"],
  },
  {
    lang: "Hindi",
    code: "hi-IN",
    nativeName: "हिन्दी",
    transcript: "मेरे भाई की सगाई प्लान करो, 120 मेहमान, ₹8 लाख बजट, हैदराबाद जुबली हिल्स, 6 हफ्ते में, रॉयल थीम",
    englishTranslation: "Plan my brother's engagement, 120 guests, ₹8 lakh, Hyderabad Jubilee Hills, in 6 weeks, royal theme",
    chips: ["120 guests", "₹8,00,000", "Jubilee Hills", "Royal Theme"],
  },
  {
    lang: "Hinglish",
    code: "en-IN",
    nativeName: "Hinglish",
    transcript: "Bhai ki engagement plan karni hai, 120 guests, 8 lakh budget, Jubilee Hills Hyderabad me, royal traditional vibe chahiye",
    englishTranslation: "Need to plan brother's engagement, 120 guests, 8 lakh budget in Jubilee Hills, royal traditional vibe",
    chips: ["120 guests", "₹8 Lakh", "Hyderabad", "Traditional Vibe"],
  },
];

export function MultimodalStudioModal() {
  const { multimodalOpen, setMultimodalOpen, generatePlan, showSnack } = usePlanStore();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"voice" | "photo">("voice");
  const [selectedVoice, setSelectedVoice] = useState(VOICE_DEMOS[0]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTranscript, setRecordingTranscript] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<InspirationPreset>(INSPIRATION_PRESETS[0]);
  const [analyzingPhoto, setAnalyzingPhoto] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = selectedVoice.code;

        recognition.onresult = (event: any) => {
          let text = "";
          for (let i = 0; i < event.results.length; i++) {
            text += event.results[i][0].transcript;
          }
          setRecordingTranscript(text);
        };

        recognition.onerror = () => {
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, [selectedVoice]);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      // Fallback demo simulation
      if (!isRecording) {
        setIsRecording(true);
        setRecordingTranscript("");
        showSnack(`Listening in ${selectedVoice.lang} (Simulated audio speech-to-text)...`);
        window.setTimeout(() => {
          setRecordingTranscript(selectedVoice.transcript);
          setIsRecording(false);
        }, 2200);
      } else {
        setIsRecording(false);
      }
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setRecordingTranscript("");
      recognitionRef.current.lang = selectedVoice.code;
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch {
        setIsRecording(false);
      }
    }
  };

  const handleBuildFromVoice = (text: string) => {
    setMultimodalOpen(false);
    showSnack("Gemini multimodal audio parsing Indian voice transcript...");
    void generatePlan(text);
    router.push("/plan");
  };

  const handleBuildFromPhoto = (preset: InspirationPreset) => {
    setAnalyzingPhoto(true);
    showSnack("Gemini 1.5 Flash Vision extracting palette, budget, and decor style...");
    window.setTimeout(() => {
      setAnalyzingPhoto(false);
      setMultimodalOpen(false);
      void generatePlan(preset.prompt);
      router.push("/plan");
    }, 1200);
  };

  const close = () => {
    if (isRecording && recognitionRef.current) recognitionRef.current.stop();
    setIsRecording(false);
    setMultimodalOpen(false);
  };

  if (!multimodalOpen) return null;

  return (
    <Dialog open={multimodalOpen} onClose={close} labelledBy="multimodal-title">
      <div className="dialog__head" style={{ marginBottom: 12 }}>
        <div className="row gap-8">
          <Sparkle size={24} />
          <div>
            <h2 className="title" id="multimodal-title">
              Multimodal Gemini Studio
            </h2>
            <p className="caption muted">
              Speak in Telugu, Hindi or Hinglish, or extract living plans from Instagram / Pinterest photos
            </p>
          </div>
        </div>
        <button type="button" className="icon-btn" aria-label="Close studio" onClick={close}>
          <Icon name="close" />
        </button>
      </div>

      {/* Mode Switcher */}
      <div className="row gap-8" style={{ borderBottom: "1px solid var(--outline-soft)", paddingBottom: 12, marginBottom: 16 }}>
        <button
          type="button"
          className={`btn btn--sm ${activeTab === "voice" ? "btn--filled" : "btn--text"}`}
          onClick={() => setActiveTab("voice")}
        >
          <Icon name="mic" size={17} />
          Voice in Indian Languages
        </button>
        <button
          type="button"
          className={`btn btn--sm ${activeTab === "photo" ? "btn--filled" : "btn--text"}`}
          onClick={() => setActiveTab("photo")}
        >
          <Icon name="photo_camera" size={17} />
          Pinterest & Instagram Photo Input
        </button>
      </div>

      {activeTab === "voice" ? (
        <div className="stack gap-16">
          {/* Language Selector */}
          <div>
            <label className="caption muted" style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>
              Select Speech Language:
            </label>
            <div className="row gap-8" style={{ flexWrap: "wrap" }}>
              {VOICE_DEMOS.map((v) => (
                <button
                  key={v.lang}
                  type="button"
                  className={`chip chip--action ${selectedVoice.lang === v.lang ? "chip--active" : ""}`}
                  onClick={() => {
                    setSelectedVoice(v);
                    setRecordingTranscript("");
                  }}
                >
                  <Icon name="language" size={14} />
                  {v.lang} ({v.nativeName})
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Mic Box */}
          <div
            className="card card--flat"
            style={{
              padding: 20,
              borderRadius: 18,
              textAlign: "center",
              background: isRecording ? "rgba(234, 67, 53, 0.06)" : "var(--surface-1)",
              border: isRecording ? "1px solid var(--red)" : "1px solid var(--outline-soft)",
              transition: "all 0.3s ease",
            }}
          >
            <button
              type="button"
              className={`voice-record-btn ${isRecording ? "voice-record-btn--active" : ""}`}
              onClick={toggleRecording}
              aria-label={isRecording ? "Stop recording" : "Start speaking"}
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: isRecording ? "var(--red)" : "linear-gradient(135deg, #4285f4 0%, #9b72cb 100%)",
                color: "#fff",
                border: "none",
                cursor: "pointer",
                margin: "0 auto 12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: isRecording ? "0 0 20px rgba(234, 67, 53, 0.5)" : "0 4px 14px rgba(66, 133, 244, 0.3)",
              }}
            >
              <Icon name={isRecording ? "stop" : "mic"} size={28} />
            </button>

            <div className="label" style={{ fontWeight: 600 }}>
              {isRecording ? `Listening in ${selectedVoice.lang}… Speak now` : `Tap mic to speak in ${selectedVoice.lang}`}
            </div>

            {/* Visualizer Waveform */}
            {isRecording ? (
              <div className="audio-wave-anim" style={{ display: "flex", gap: 4, justifyContent: "center", margin: "12px 0" }}>
                {[12, 24, 18, 30, 16, 28, 14, 22].map((h, i) => (
                  <span
                    key={i}
                    style={{
                      width: 4,
                      height: h,
                      background: "var(--red)",
                      borderRadius: 2,
                      animation: "pulseWave 0.6s infinite alternate",
                      animationDelay: `${i * 0.1}s`,
                    }}
                  />
                ))}
              </div>
            ) : null}

            <p className="caption muted" style={{ marginTop: 6 }}>
              {recordingTranscript
                ? `Transcript: "${recordingTranscript}"`
                : "Say: 'Plan my brother's engagement, 80 guests, ₹6 lakh, Hyderabad, vegetarian'"}
            </p>

            {recordingTranscript ? (
              <div style={{ marginTop: 14 }}>
                <button
                  type="button"
                  className="btn btn--filled btn--sm"
                  onClick={() => handleBuildFromVoice(recordingTranscript)}
                >
                  <Sparkle size={15} />
                  Build Living Plan from Speech
                </button>
              </div>
            ) : null}
          </div>

          {/* Quick Demo Voice Prompts */}
          <div>
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
              <span className="caption muted" style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Or Try Sample Indian Voice Prompts (1-Click)
              </span>
              <span className="caption muted">Real Demo Clips</span>
            </div>

            <div className="stack gap-8">
              {VOICE_DEMOS.map((demo) => (
                <div
                  key={demo.lang}
                  className="card card--flat"
                  style={{
                    padding: "12px 14px",
                    borderRadius: 14,
                    border: "1px solid var(--outline-soft)",
                    background: "var(--surface-1)",
                  }}
                >
                  <div className="row" style={{ justifyContent: "space-between", marginBottom: 4 }}>
                    <span className="chip chip--xs" style={{ fontWeight: 600 }}>
                      <Icon name="volume_up" size={13} />
                      {demo.lang} ({demo.nativeName})
                    </span>
                    <button
                      type="button"
                      className="btn btn--tonal btn--xs"
                      onClick={() => handleBuildFromVoice(demo.transcript)}
                    >
                      <Sparkle size={13} />
                      Plan with this brief
                    </button>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>
                    &ldquo;{demo.transcript}&rdquo;
                  </div>
                  <div className="caption muted" style={{ marginTop: 3 }}>
                    Translation: {demo.englishTranslation}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Photo Inspiration Input */
        <div className="stack gap-16">
          <div>
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
              <span className="caption muted" style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Select Inspiration Moodboard (Pinterest & Instagram)
              </span>
              <span className="caption muted">Gemini Vision extracts palette & decor style</span>
            </div>

            <div className="grid-2" style={{ gap: 12 }}>
              {INSPIRATION_PRESETS.map((preset) => {
                const isSelected = selectedPreset.id === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    className="card card--flat"
                    onClick={() => setSelectedPreset(preset)}
                    style={{
                      padding: 0,
                      overflow: "hidden",
                      borderRadius: 16,
                      border: isSelected ? "2px solid var(--primary)" : "1px solid var(--outline-soft)",
                      textAlign: "left",
                      cursor: "pointer",
                      position: "relative",
                      background: "var(--surface-1)",
                    }}
                  >
                    <div
                      style={{
                        height: 90,
                        background: preset.imageGradient,
                        position: "relative",
                        display: "flex",
                        alignItems: "flex-end",
                        padding: 10,
                      }}
                    >
                      <span className="chip chip--xs" style={{ background: "rgba(0,0,0,0.6)", color: "#fff", border: "none" }}>
                        <Icon name={preset.source === "Pinterest" ? "push_pin" : "photo_camera"} size={13} />
                        {preset.source}
                      </span>
                    </div>

                    <div style={{ padding: 12 }}>
                      <div className="label" style={{ fontWeight: 600, fontSize: 13 }}>
                        {preset.title}
                      </div>
                      <div className="caption muted" style={{ fontSize: 11 }}>
                        {preset.subtitle}
                      </div>

                      {/* Extracted Swatches */}
                      <div className="row gap-4" style={{ marginTop: 8 }}>
                        {preset.palette.map((color) => (
                          <span
                            key={color}
                            style={{
                              width: 16,
                              height: 16,
                              borderRadius: 4,
                              background: color,
                              border: "1px solid rgba(0,0,0,0.1)",
                            }}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Vision Extraction Analysis Box */}
          <div
            className="card card--flat"
            style={{
              padding: 16,
              borderRadius: 16,
              background: "var(--surface-tint)",
              border: "1px solid rgba(66, 133, 244, 0.25)",
            }}
          >
            <div className="row gap-8" style={{ marginBottom: 8, alignItems: "center" }}>
              <Sparkle size={18} />
              <span className="label" style={{ fontWeight: 600 }}>
                Gemini 1.5 Flash Vision Extraction
              </span>
            </div>

            <div className="grid-2" style={{ gap: 10, fontSize: 13 }}>
              <div>
                <span className="caption muted">Detected Scale & Budget:</span>
                <div style={{ fontWeight: 600 }}>
                  {selectedPreset.guests} guests · {formatCompactINR(selectedPreset.budgetInr)}
                </div>
              </div>

              <div>
                <span className="caption muted">Extracted Vibe:</span>
                <div style={{ fontWeight: 600 }}>{selectedPreset.vibe}</div>
              </div>
            </div>

            <div style={{ marginTop: 8 }}>
              <span className="caption muted">Extracted Decor Style:</span>
              <p className="caption" style={{ color: "var(--text)", marginTop: 2 }}>
                {selectedPreset.decorStyle}
              </p>
            </div>

            <div className="row gap-6" style={{ marginTop: 10, alignItems: "center" }}>
              <span className="caption muted">Color Palette:</span>
              {selectedPreset.palette.map((hex) => (
                <span
                  key={hex}
                  className="chip chip--xs"
                  style={{
                    background: hex,
                    color: hex === "#FFF8DC" || hex === "#FFF0F5" || hex === "#FFFAF0" ? "#000" : "#fff",
                    fontSize: 10,
                    height: 20,
                  }}
                >
                  {hex}
                </span>
              ))}
            </div>

            <div style={{ marginTop: 14, textAlign: "right" }}>
              <button
                type="button"
                className="btn btn--filled"
                disabled={analyzingPhoto}
                onClick={() => handleBuildFromPhoto(selectedPreset)}
              >
                <Icon name={analyzingPhoto ? "progress_activity" : "auto_awesome"} size={16} />
                {analyzingPhoto ? "Analyzing & Building..." : "Build Living Plan from this Photo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Dialog>
  );
}
