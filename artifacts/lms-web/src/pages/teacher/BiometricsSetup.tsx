import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useApi } from "@/hooks/useApi";
import { Button } from "@/components/ui/button";
import { Loader2, Camera, Mic, CheckCircle, ShieldCheck } from "lucide-react";
import * as faceapi from "@vladmandic/face-api";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

// Bug fix #5: POSES must be an Array, not a single object
type Pose = "front" | "left" | "right" | "up" | "down";
const POSES: Array<{ id: Pose; label: string }> = [
  { id: "front", label: "Look Straight" },
  { id: "left",  label: "Look Left" },
  { id: "right", label: "Look Right" },
  { id: "up",    label: "Look Up" },
  { id: "down",  label: "Look Down" },
];

export default function BiometricsSetup() {
  // Bug fix #3: AuthContext exposes `refetchUser`, NOT `refreshUser`
  const { user, refetchUser } = useAuth();
  // Bug fix #2: wouter uses useLocation, not useNavigate
  const [, setLocation] = useLocation();
  // Bug fix #7: use the correct hook (useApi) instead of a non-existent default import
  const api = useApi();
  const { toast } = useToast();

  const [step, setStep] = useState<"intro" | "face" | "voice" | "done">("intro");

  // ── Face Phase ─────────────────────────────────────────────────────────────
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [currentPoseIndex, setCurrentPoseIndex] = useState(0);
  const [capturedDescriptors, setCapturedDescriptors] = useState<Record<string, number[]>>({});
  const [isProcessingFace, setIsProcessingFace] = useState(false);

  // ── Voice Phase ────────────────────────────────────────────────────────────
  const [script, setScript] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already verified
  useEffect(() => {
    if (user?.biometricsVerified) {
      setLocation("/teacher/dashboard");
    }
  }, [user, setLocation]);

  // ── Load face-api models when entering face step ───────────────────────────
  useEffect(() => {
    if (step !== "face") return;
    (async () => {
      try {
        const MODEL_URL = "/models";
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        setIsModelsLoaded(true);
      } catch {
        toast({ title: "Error loading face-recognition models. Please reload.", variant: "destructive" });
      }
    })();
  }, [step]);

  // ── Start / stop camera when face step is active ───────────────────────────
  useEffect(() => {
    if (step !== "face" || !isModelsLoaded) return;

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } } })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setIsCameraReady(true);
        }
      })
      .catch(() => toast({ title: "Camera access denied or unavailable.", variant: "destructive" }));

    // Stop camera when leaving face step
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setIsCameraReady(false);
    };
  }, [step, isModelsLoaded]);

  // ── Capture a single pose ──────────────────────────────────────────────────
  const capturePose = async () => {
    if (!videoRef.current || !isCameraReady) return;
    setIsProcessingFace(true);
    try {
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        toast({ title: "No face detected — ensure good lighting and look at the camera.", variant: "destructive" });
        return;
      }

      const pose = POSES[currentPoseIndex].id;
      const descriptor = Array.from(detection.descriptor);
      const newDescriptors = { ...capturedDescriptors, [pose]: descriptor };
      setCapturedDescriptors(newDescriptors);

      if (currentPoseIndex < POSES.length - 1) {
        // Move to next pose
        setCurrentPoseIndex((p) => p + 1);
        toast({ title: `✓ ${POSES[currentPoseIndex].label} captured!` });
      } else {
        // All 5 poses done — submit to backend
        await api.post("/biometrics/setup-face", { faceDescriptors: newDescriptors });
        // Stop the camera before moving on
        streamRef.current?.getTracks().forEach((t) => t.stop());
        toast({ title: "Face setup complete!" });
        setStep("voice");
      }
    } catch (err: any) {
      toast({ title: "Error processing face: " + (err?.message ?? "unknown"), variant: "destructive" });
    } finally {
      setIsProcessingFace(false);
    }
  };

  // ── Fetch voice script when entering voice step ────────────────────────────
  useEffect(() => {
    if (step !== "voice") return;
    // Bug fix #4: api.get returns the data directly (unwrapped), not `{ data: ... }`
    api.get("/biometrics/voice-script").then((res: any) => setScript(res.script ?? ""));
  }, [step]);

  // ── Start recording ────────────────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      // Bug fix #6: use local array, not the unused `audioChunks` React state
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch {
      toast({ title: "Microphone access denied.", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  // ── Submit voice recording ─────────────────────────────────────────────────
  const submitVoice = async () => {
    if (!audioBlob) return;
    setIsSubmitting(true);
    try {
      // Bug fix #7 (continued): useApi.post stringifies JSON and forces application/json header.
      // For multipart/form-data we must use raw fetch so the browser sets the boundary automatically.
      const token = localStorage.getItem("lms_token");
      const formData = new FormData();
      formData.append("audio", audioBlob, "voice_sample.webm");
      formData.append("scriptText", script);

      const res = await fetch("/api/biometrics/setup-voice", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error ?? res.statusText);
      }

      // Bug fix #3: use refetchUser (correct name) instead of refreshUser
      await refetchUser();
      toast({ title: "Biometric setup complete! You are now verified." });
      setStep("done");
    } catch (err: any) {
      toast({ title: "Failed to upload voice sample: " + (err?.message ?? "unknown"), variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto py-12 px-4 space-y-6">
      <div className="text-center space-y-2">
        <ShieldCheck className="w-10 h-10 text-primary mx-auto" />
        <h1 className="text-3xl font-bold">Teacher Identity Verification</h1>
        <p className="text-muted-foreground text-sm">One-time biometric setup — required to create and upload content</p>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-3">
        {(["intro", "face", "voice", "done"] as const).map((s, i) => (
          <React.Fragment key={s}>
            <div
              className={`w-3 h-3 rounded-full transition-all ${
                step === s ? "bg-primary scale-125" : (["intro", "face", "voice", "done"] as const).indexOf(step) > i ? "bg-green-500" : "bg-muted"
              }`}
            />
            {i < 3 && <div className="w-8 h-0.5 bg-muted" />}
          </React.Fragment>
        ))}
      </div>

      {/* ── INTRO ── */}
      {step === "intro" && (
        <div className="text-center space-y-6 bg-card p-8 rounded-xl border shadow-sm">
          <p className="text-muted-foreground leading-relaxed">
            To protect platform integrity and verify your identity as a teacher, we require a one-time biometric setup.
            You will capture your face from <strong>5 angles</strong> and record a short <strong>voice sample</strong>.
            This data is stored securely and never shared.
          </p>
          <Button size="lg" onClick={() => setStep("face")} className="gap-2">
            <Camera className="w-4 h-4" /> Start Verification
          </Button>
        </div>
      )}

      {/* ── FACE ── */}
      {step === "face" && (
        <div className="flex flex-col items-center space-y-5 bg-card p-8 rounded-xl border shadow-sm">
          <div>
            <h2 className="text-2xl font-semibold text-center">Step 1 of 2 — Facial Recognition</h2>
            <p className="text-muted-foreground text-center text-sm mt-1">
              Pose {currentPoseIndex + 1} of {POSES.length}
            </p>
          </div>

          <div className="relative w-full max-w-sm bg-black rounded-2xl overflow-hidden aspect-video flex items-center justify-center border-2 border-primary/20">
            {!isCameraReady && (
              <div className="flex flex-col items-center gap-2 text-white/70">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="text-sm">{isModelsLoaded ? "Starting camera…" : "Loading AI models…"}</span>
              </div>
            )}
            <video
              ref={videoRef}
              muted
              playsInline
              className={`w-full h-full object-cover transition-opacity ${isCameraReady ? "opacity-100" : "opacity-0"}`}
            />
            {isCameraReady && (
              <div className="absolute inset-0 border-4 border-dashed border-primary/40 m-6 rounded-full pointer-events-none" />
            )}
          </div>

          <div className="text-2xl font-bold text-primary animate-pulse">
            ↗ {POSES[currentPoseIndex].label}
          </div>

          {/* Pose progress dots */}
          <div className="flex gap-2">
            {POSES.map((p, i) => (
              <div
                key={p.id}
                className={`w-3 h-3 rounded-full transition-all ${
                  i < currentPoseIndex ? "bg-green-500" : i === currentPoseIndex ? "bg-primary scale-125" : "bg-muted"
                }`}
              />
            ))}
          </div>

          <Button
            size="lg"
            onClick={capturePose}
            disabled={!isCameraReady || isProcessingFace}
            className="w-full max-w-xs gap-2"
          >
            {isProcessingFace ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
            ) : (
              <><Camera className="w-4 h-4" /> Capture — {POSES[currentPoseIndex].label}</>
            )}
          </Button>
        </div>
      )}

      {/* ── VOICE ── */}
      {step === "voice" && (
        <div className="flex flex-col items-center space-y-5 bg-card p-8 rounded-xl border shadow-sm">
          <h2 className="text-2xl font-semibold text-center">Step 2 of 2 — Voice Recognition</h2>
          <p className="text-muted-foreground text-center text-sm">
            Read the script below clearly, then click <strong>Stop Recording</strong>.
          </p>

          <div className="bg-muted/60 border rounded-xl p-6 w-full text-center text-lg font-medium italic leading-relaxed">
            {script ? `"${script}"` : <Loader2 className="w-5 h-5 animate-spin mx-auto" />}
          </div>

          <div className="flex gap-4 flex-wrap justify-center">
            {!isRecording ? (
              <Button
                size="lg"
                onClick={startRecording}
                variant={audioBlob ? "outline" : "default"}
                disabled={!script}
                className="gap-2"
              >
                <Mic className="w-4 h-4" />
                {audioBlob ? "Re-record" : "Start Recording"}
              </Button>
            ) : (
              <Button size="lg" onClick={stopRecording} variant="destructive" className="gap-2">
                <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
                Stop Recording
              </Button>
            )}
          </div>

          {audioBlob && (
            <div className="flex flex-col items-center gap-4 w-full max-w-sm">
              <audio src={URL.createObjectURL(audioBlob)} controls className="w-full" />
              <Button size="lg" className="w-full gap-2" onClick={submitVoice} disabled={isSubmitting}>
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>
                ) : (
                  <><CheckCircle className="w-4 h-4" /> Submit Voice Sample</>
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ── DONE ── */}
      {step === "done" && (
        <div className="flex flex-col items-center space-y-5 bg-card p-8 rounded-xl border shadow-sm text-center">
          <CheckCircle className="w-20 h-20 text-green-500" />
          <h2 className="text-2xl font-semibold">Verification Complete 🎉</h2>
          <p className="text-muted-foreground max-w-sm">
            Your biometric identity profile has been successfully saved. You can now create and upload courses.
          </p>
          <Button size="lg" onClick={() => setLocation("/teacher/dashboard")} className="gap-2">
            Go to Dashboard
          </Button>
        </div>
      )}
    </div>
  );
}
