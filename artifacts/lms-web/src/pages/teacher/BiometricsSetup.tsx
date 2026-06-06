import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../components/AuthProvider";
import { Button } from "../../components/ui/button";
import { Loader2, Camera, Mic, CheckCircle } from "lucide-react";
import * as faceapi from "@vladmandic/face-api";
import api from "../../lib/api";
import { useNavigate } from "wouter";
import { toast } from "../../hooks/use-toast";

type Pose = "front" | "left" | "right" | "up" | "down";

const POSES: { id: Pose; label: string; icon: any } = [
  { id: "front", label: "Look Straight", icon: Camera },
  { id: "left", label: "Look Left", icon: Camera },
  { id: "right", label: "Look Right", icon: Camera },
  { id: "up", label: "Look Up", icon: Camera },
  { id: "down", label: "Look Down", icon: Camera },
];

export default function BiometricsSetup() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<"intro" | "face" | "voice" | "done">("intro");

  // Face Phase
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [currentPoseIndex, setCurrentPoseIndex] = useState(0);
  const [faceDescriptors, setFaceDescriptors] = useState<Record<string, number[]>>({});
  const [isProcessingFace, setIsProcessingFace] = useState(false);

  // Voice Phase
  const [script, setScript] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user?.biometricsVerified) {
      navigate("/teacher/dashboard");
    }
  }, [user]);

  // Load Face Models
  useEffect(() => {
    if (step === "face") {
      const loadModels = async () => {
        try {
          const MODEL_URL = "/models";
          await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
          ]);
          setIsModelsLoaded(true);
        } catch (err) {
          toast({ title: "Error loading face models", variant: "destructive" });
        }
      };
      loadModels();
    }
  }, [step]);

  // Start Camera
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (step === "face" && isModelsLoaded) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: "user" } })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.play();
            setIsCameraReady(true);
          }
        })
        .catch(() => toast({ title: "Camera access denied", variant: "destructive" }));
    }
    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [step, isModelsLoaded]);

  const capturePose = async () => {
    if (!videoRef.current) return;
    setIsProcessingFace(true);
    try {
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection) {
        const pose = POSES[currentPoseIndex].id;
        setFaceDescriptors((prev) => ({ ...prev, [pose]: Array.from(detection.descriptor) }));
        if (currentPoseIndex < POSES.length - 1) {
          setCurrentPoseIndex((p) => p + 1);
        } else {
          // Submit face descriptors
          await api.post("/biometrics/setup-face", {
            faceDescriptors: { ...faceDescriptors, [pose]: Array.from(detection.descriptor) },
          });
          toast({ title: "Face setup complete!" });
          setStep("voice");
        }
      } else {
        toast({ title: "No face detected. Please ensure good lighting.", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error capturing face", variant: "destructive" });
    } finally {
      setIsProcessingFace(false);
    }
  };

  // Voice Setup
  useEffect(() => {
    if (step === "voice") {
      api.get("/biometrics/voice-script").then((res) => setScript(res.data.script));
    }
  }, [step]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
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
    } catch (err) {
      toast({ title: "Microphone access denied", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const submitVoice = async () => {
    if (!audioBlob) return;
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "voice_sample.webm");
      formData.append("scriptText", script);

      await api.post("/biometrics/setup-voice", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await refreshUser();
      toast({ title: "Biometric setup complete!" });
      setStep("done");
    } catch (err) {
      toast({ title: "Failed to upload voice sample", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Teacher Identity Verification</h1>

      {step === "intro" && (
        <div className="text-center space-y-6 bg-card p-8 rounded-xl border shadow-sm">
          <p className="text-lg text-muted-foreground">
            To ensure the integrity of our platform and protect your content, we require a one-time biometric setup.
            This involves capturing your face from multiple angles and recording a short voice sample.
          </p>
          <Button size="lg" onClick={() => setStep("face")}>
            Start Verification
          </Button>
        </div>
      )}

      {step === "face" && (
        <div className="flex flex-col items-center space-y-6 bg-card p-8 rounded-xl border shadow-sm">
          <h2 className="text-2xl font-semibold">Step 1: Facial Recognition</h2>
          <p className="text-muted-foreground text-center">
            Please align your face in the camera and follow the instructions below.
          </p>

          <div className="relative w-full max-w-md bg-black rounded-xl overflow-hidden aspect-video flex items-center justify-center">
            {!isCameraReady && <Loader2 className="w-8 h-8 animate-spin text-white" />}
            <video ref={videoRef} muted playsInline className={`w-full h-full object-cover ${isCameraReady ? "opacity-100" : "opacity-0"}`} />
            {isCameraReady && <div className="absolute inset-0 border-4 border-dashed border-primary/50 m-8 rounded-full pointer-events-none" />}
          </div>

          <div className="text-xl font-medium animate-pulse text-primary">
            {POSES[currentPoseIndex].label}
          </div>

          <Button size="lg" onClick={capturePose} disabled={!isCameraReady || isProcessingFace} className="w-full max-w-sm">
            {isProcessingFace ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Camera className="w-4 h-4 mr-2" />}
            Capture {POSES[currentPoseIndex].label}
          </Button>

          <div className="flex gap-2 mt-4">
            {POSES.map((p, i) => (
              <div key={p.id} className={`w-3 h-3 rounded-full ${i < currentPoseIndex ? "bg-green-500" : i === currentPoseIndex ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>
        </div>
      )}

      {step === "voice" && (
        <div className="flex flex-col items-center space-y-6 bg-card p-8 rounded-xl border shadow-sm">
          <h2 className="text-2xl font-semibold">Step 2: Voice Recognition</h2>
          <p className="text-muted-foreground text-center">Please read the following script aloud.</p>

          <div className="bg-muted p-6 rounded-lg text-lg font-medium w-full max-w-lg text-center italic border">
            "{script}"
          </div>

          <div className="flex gap-4">
            {!isRecording ? (
              <Button size="lg" onClick={startRecording} variant={audioBlob ? "outline" : "default"}>
                <Mic className="w-4 h-4 mr-2" />
                {audioBlob ? "Re-record" : "Start Recording"}
              </Button>
            ) : (
              <Button size="lg" onClick={stopRecording} variant="destructive">
                <div className="w-3 h-3 bg-white rounded-full mr-2 animate-pulse" />
                Stop Recording
              </Button>
            )}
          </div>

          {audioBlob && (
            <div className="flex flex-col items-center gap-4 w-full max-w-sm mt-4">
              <audio src={URL.createObjectURL(audioBlob)} controls className="w-full" />
              <Button size="lg" className="w-full" onClick={submitVoice} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                Submit Voice Sample
              </Button>
            </div>
          )}
        </div>
      )}

      {step === "done" && (
        <div className="flex flex-col items-center space-y-6 bg-card p-8 rounded-xl border shadow-sm text-center">
          <CheckCircle className="w-16 h-16 text-green-500" />
          <h2 className="text-2xl font-semibold">Verification Complete</h2>
          <p className="text-muted-foreground">
            Your biometric identity profile has been successfully set up. You can now start creating and uploading courses.
          </p>
          <Button size="lg" onClick={() => navigate("/teacher/dashboard")}>
            Go to Dashboard
          </Button>
        </div>
      )}
    </div>
  );
}
