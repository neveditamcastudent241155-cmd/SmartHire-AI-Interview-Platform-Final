"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Video, VideoOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { interviewer } from "@/constants";
import { createFeedback } from "@/lib/actions/general.action";
import { getVapi } from "@/lib/vapi.sdk";
 

enum InterviewRound {
  WARMUP = "WARMUP",
  TECHNICAL = "TECHNICAL",
  DSA = "DSA",
  SYSTEM_DESIGN = "SYSTEM_DESIGN",
  BEHAVIORAL = "BEHAVIORAL",
  FINAL = "FINAL",
}

enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
}

interface SavedMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

const Agent = ({
  userName,
  userId,
  interviewId,
  feedbackId,
  type,
  questions,
}: AgentProps) => {
  const router = useRouter();
  const vapi = getVapi();
    const [callStatus, setCallStatus] = useState<CallStatus>(
    CallStatus.INACTIVE
  );

  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastMessage, setLastMessage] = useState("");
  const [cameraOn, setCameraOn] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
    // ===========================
  // Camera Functions
  // ===========================

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setCameraOn(true);
    } catch (error) {
      console.error("Camera Error:", error);
      setCameraOn(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraOn(false);
  };

  const toggleCamera = async () => {
    if (cameraOn) {
      stopCamera();
    } else {
      await startCamera();
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);
    // ===========================
  // Vapi Event Listeners
  // ===========================

  useEffect(() => {
    const onCallStart = () => {
      console.log("Call Started");
      setCallStatus(CallStatus.ACTIVE);
    };

    const onCallEnd = () => {
      console.log("Call Ended");
      setCallStatus(CallStatus.FINISHED);
    };

    const onSpeechStart = () => {
      setIsSpeaking(true);
    };

    const onSpeechEnd = () => {
      setIsSpeaking(false);
    };

    const onMessage = (message: Message) => {
      console.log("Vapi Message:", message);

      if (
        message.type === "transcript" &&
        message.transcriptType === "final"
      ) {
        const newMessage: SavedMessage = {
          role: message.role as "user" | "assistant" | "system",
          content: message.transcript,
        };

        setMessages((prev) => [...prev, newMessage]);
      }
    };

    const onError = (error: Error) => {
      console.error("Vapi Error:", error);
      setCallStatus(CallStatus.INACTIVE);
    };

    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("speech-start", onSpeechStart);
    vapi.on("speech-end", onSpeechEnd);
    vapi.on("message", onMessage);
    vapi.on("error", onError);

    return () => {
      vapi.off("call-start", onCallStart);
      vapi.off("call-end", onCallEnd);
      vapi.off("speech-start", onSpeechStart);
      vapi.off("speech-end", onSpeechEnd);
      vapi.off("message", onMessage);
      vapi.off("error", onError);
    };
  }, [vapi]);
    // ===========================
  // Transcript & Feedback
  // ===========================

  useEffect(() => {
    if (messages.length > 0) {
      setLastMessage(messages[messages.length - 1].content);
    }
  }, [messages]);

  useEffect(() => {
    const generateFeedback = async () => {
      if (!interviewId || !userId) {
        console.error("Interview ID or User ID missing");
        router.push("/");
        return;
      }

      try {
        const { success, feedbackId: id } = await createFeedback({
          interviewId,
          userId,
          transcript: messages,
          feedbackId,
        });

        if (success && id) {
          router.push(`/interview/${interviewId}/feedback`);
        } else {
          router.push("/");
        }
      } catch (error) {
        console.error("Feedback Error:", error);
        router.push("/");
      }
    };

    if (callStatus !== CallStatus.FINISHED) return;

    if (type === "generate") {
      router.push("/");
      return;
    }

    generateFeedback();
  }, [
    callStatus,
    messages,
    feedbackId,
    interviewId,
    router,
    type,
    userId,
  ]);
    // ===========================
  // Start Interview
  // ===========================

  const handleCall = async () => {
    try {
      setCallStatus(CallStatus.CONNECTING);

      const formattedQuestions = questions?.length
        ? questions.map((q) => `• ${q}`).join("\n")
        : "";

      await vapi.start(
        process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID!,
        {
          variableValues: {
            username: userName,
            userid: userId,
            questions: formattedQuestions,
            interviewRound: InterviewRound.WARMUP,
          },
        }
      );
    } catch (error) {
      console.error("Failed to start interview:", error);
      setCallStatus(CallStatus.INACTIVE);
    }
  };

  // ===========================
  // End Interview
  // ===========================

  const handleDisconnect = () => {
    try {
      vapi.stop();
    } catch (error) {
      console.error(error);
    }

    stopCamera();
    setIsSpeaking(false);
    setCallStatus(CallStatus.FINISHED);
  };
    return (
    <>
      <div className="call-view">

        {/* AI Interviewer */}

        <div className="card-interviewer">
          <div className="avatar relative">
            <Image
              src="/logo2.png"
              alt="AI Interviewer"
              width={70}
              height={70}
              className="rounded-full object-cover"
              priority
            />

            {isSpeaking && (
              <span className="absolute inset-0 rounded-full border-4 border-green-500 animate-ping" />
            )}
          </div>

          <h3 className="mt-4 text-xl font-semibold">
            AI Interviewer
          </h3>

          <p className="text-sm text-gray-400 mt-2">
            {callStatus === CallStatus.INACTIVE &&
              "Ready to begin your interview"}

            {callStatus === CallStatus.CONNECTING &&
              "Connecting..."}

            {callStatus === CallStatus.ACTIVE &&
              "Interview in Progress"}

            {callStatus === CallStatus.FINISHED &&
              "Interview Completed"}
          </p>
        </div>

        {/* Candidate */}

        <div className="card-border">
          <div className="card-content relative flex flex-col items-center gap-4">

            {cameraOn ? (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="rounded-2xl object-cover w-[260px] h-[260px]"
              />
            ) : (
              <Image
                src="/userProfile.jpg"
                alt={userName}
                width={260}
                height={260}
                className="rounded-full object-cover w-[180px] h-[180px]"
              />
            )}

            <h3 className="text-lg font-semibold">
              {userName}
            </h3>

            <button
              onClick={toggleCamera}
              className="absolute bottom-3 right-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white p-3 transition-all"
            >
              {cameraOn ? (
                <VideoOff size={22} />
              ) : (
                <Video size={22} />
              )}
            </button>

          </div>
        </div>

      </div>
            {/* ================= Live Transcript ================= */}

      {messages.length > 0 && (
        <div className="transcript-border mt-8">
          <div className="transcript">
            <p
              key={lastMessage}
              className={cn(
                "transition-opacity duration-500",
                "animate-fadeIn"
              )}
            >
              {lastMessage}
            </p>
          </div>
        </div>
      )}

      {/* ================= Controls ================= */}

      <div className="w-full flex justify-center mt-10">
        {callStatus === CallStatus.ACTIVE ? (
          <button
            onClick={handleDisconnect}
            className="btn-disconnect"
          >
            End Interview
          </button>
        ) : (
          <button
            onClick={handleCall}
            disabled={callStatus === CallStatus.CONNECTING}
            className="relative btn-call disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {callStatus === CallStatus.CONNECTING && (
              <span className="absolute inset-0 rounded-full animate-ping" />
            )}

            <span className="relative">
              {callStatus === CallStatus.CONNECTING
                ? "Connecting..."
                : callStatus === CallStatus.FINISHED
                ? "Start New Interview"
                : "Start Interview"}
            </span>
          </button>
        )}
      </div>
    </>
  );
};

export default Agent;