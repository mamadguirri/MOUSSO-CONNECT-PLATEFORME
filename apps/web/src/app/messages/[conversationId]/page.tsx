"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Send,
  Paperclip,
  Mic,
  FileText,
  X,
  Play,
  Pause,
} from "lucide-react";

import { apiGet, apiPost, apiPostForm } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Skeleton } from "@/components/ui/skeleton";

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Aujourd'hui";
  if (date.toDateString() === yesterday.toDateString()) return "Hier";
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
}

// Composant bulle vocal
function VoiceMessage({ fileUrl, duration }: { fileUrl: string; duration?: number }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(fileUrl);
      audioRef.current.onended = () => {
        setPlaying(false);
        setProgress(0);
      };
      audioRef.current.ontimeupdate = () => {
        if (audioRef.current) {
          setProgress(
            (audioRef.current.currentTime / (audioRef.current.duration || 1)) * 100
          );
        }
      };
    }
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setPlaying(!playing);
  };

  return (
    <div className="flex items-center gap-2 min-w-[180px]">
      <button
        onClick={togglePlay}
        className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0"
      >
        {playing ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4 ml-0.5" />
        )}
      </button>
      <div className="flex-1">
        <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-current rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        {duration && (
          <span className="text-[10px] opacity-70">{duration}s</span>
        )}
      </div>
    </div>
  );
}

export default function ChatPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [text, setText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [previewFile, setPreviewFile] = useState<{
    file: File;
    type: "IMAGE" | "FILE";
    preview?: string;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Charger les messages
  const { data, isLoading } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => apiGet<any>(`/messages/conversations/${conversationId}/messages`),
    enabled: !!user && !!conversationId,
    refetchInterval: 5000,
  });

  const messages = data?.messages || [];
  const otherUser = data?.conversation?.otherUser;
  const otherAvatar = data?.conversation?.otherAvatar;

  // Scroll en bas quand messages changent
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Invalider le compteur non-lus
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["conversations"] });
    queryClient.invalidateQueries({ queryKey: ["unread-count"] });
  }, [messages.length, queryClient]);

  // Envoi texte
  const sendTextMutation = useMutation({
    mutationFn: (content: string) =>
      apiPost(`/messages/conversations/${conversationId}/messages`, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      setText("");
      inputRef.current?.focus();
    },
  });

  // Envoi fichier
  const sendFileMutation = useMutation({
    mutationFn: ({ file, type }: { file: File; type: string }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);
      return apiPostForm(`/messages/conversations/${conversationId}/files`, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      setPreviewFile(null);
    },
  });

  // Envoi vocal
  const sendVoiceMutation = useMutation({
    mutationFn: ({ blob, duration }: { blob: Blob; duration: number }) => {
      const formData = new FormData();
      formData.append("file", blob, "voice.webm");
      formData.append("type", "VOICE");
      formData.append("duration", duration.toString());
      return apiPostForm(`/messages/conversations/${conversationId}/files`, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
    },
  });

  const handleSend = () => {
    if (previewFile) {
      sendFileMutation.mutate({ file: previewFile.file, type: previewFile.type });
      return;
    }
    if (text.trim()) {
      sendTextMutation.mutate(text.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    setPreviewFile({
      file,
      type: isImage ? "IMAGE" : "FILE",
      preview: isImage ? URL.createObjectURL(file) : undefined,
    });
    e.target.value = "";
  };

  // Enregistrement vocal
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((t) => t.stop());
        sendVoiceMutation.mutate({ blob, duration: recordingTime });
        setRecordingTime(0);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch {
      alert("Impossible d'accéder au microphone");
    }
  }, [recordingTime, sendVoiceMutation]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording]);

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      mediaRecorderRef.current = null;
      chunksRef.current = [];
      setIsRecording(false);
      setRecordingTime(0);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording]);

  // Grouper par date
  const groupedMessages: { date: string; msgs: any[] }[] = [];
  let lastDate = "";
  messages.forEach((msg: any) => {
    const date = new Date(msg.createdAt).toDateString();
    if (date !== lastDate) {
      groupedMessages.push({ date: msg.createdAt, msgs: [] });
      lastDate = date;
    }
    groupedMessages[groupedMessages.length - 1].msgs.push(msg);
  });

  useEffect(() => {
    if (!user) router.push("/auth/login");
  }, [user, router]);

  if (!user) return null;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <button onClick={() => router.push("/messages")} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </button>
        {isLoading ? (
          <Skeleton className="w-10 h-10 rounded-full" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-musso-pink-light flex items-center justify-center overflow-hidden">
            {otherAvatar ? (
              <img src={otherAvatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-musso-pink font-bold">
                {otherUser?.name?.[0] || "?"}
              </span>
            )}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-sm truncate">
            {isLoading ? <Skeleton className="h-4 w-24" /> : otherUser?.name || "Conversation"}
          </h2>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : ""}`}>
                <Skeleton className="h-10 w-48 rounded-2xl" />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-sm">
              Commencez la conversation ! 👋
            </p>
          </div>
        ) : (
          groupedMessages.map((group, gi) => (
            <div key={gi}>
              {/* Séparateur de date */}
              <div className="flex items-center justify-center my-4">
                <span className="text-[11px] text-gray-400 bg-gray-100 px-3 py-0.5 rounded-full">
                  {formatDate(group.date)}
                </span>
              </div>
              {group.msgs.map((msg: any) => {
                const isMine = msg.senderId === user.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex mb-1.5 ${isMine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2 ${
                        isMine
                          ? "bg-musso-pink text-white rounded-br-md"
                          : "bg-white text-gray-800 shadow-sm rounded-bl-md"
                      }`}
                    >
                      {/* Image */}
                      {msg.type === "IMAGE" && msg.fileUrl && (
                        <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer">
                          <img
                            src={msg.fileUrl}
                            alt="Photo"
                            className="rounded-lg max-w-full max-h-64 object-cover mb-1"
                          />
                        </a>
                      )}

                      {/* Vocal */}
                      {msg.type === "VOICE" && msg.fileUrl && (
                        <VoiceMessage fileUrl={msg.fileUrl} duration={msg.duration} />
                      )}

                      {/* Fichier */}
                      {msg.type === "FILE" && msg.fileUrl && (
                        <a
                          href={msg.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center gap-2 ${isMine ? "text-white" : "text-musso-pink"}`}
                        >
                          <FileText className="w-5 h-5 flex-shrink-0" />
                          <span className="text-sm underline truncate">
                            {msg.fileName || "Fichier"}
                          </span>
                        </a>
                      )}

                      {/* Texte */}
                      {msg.type === "TEXT" && (
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                      )}

                      <p
                        className={`text-[10px] mt-0.5 ${
                          isMine ? "text-white/60" : "text-gray-400"
                        } text-right`}
                      >
                        {formatTime(msg.createdAt)}
                        {isMine && msg.isRead && " ✓✓"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Preview fichier */}
      {previewFile && (
        <div className="bg-white border-t px-4 py-3 flex items-center gap-3">
          {previewFile.type === "IMAGE" && previewFile.preview ? (
            <img src={previewFile.preview} alt="" className="w-16 h-16 rounded-lg object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{previewFile.file.name}</p>
            <p className="text-xs text-gray-400">
              {(previewFile.file.size / 1024).toFixed(0)} Ko
            </p>
          </div>
          <button onClick={() => setPreviewFile(null)} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Barre d'envoi */}
      <div className="bg-white border-t px-3 py-2 flex items-end gap-2 flex-shrink-0">
        {isRecording ? (
          // Mode enregistrement vocal
          <div className="flex-1 flex items-center gap-3">
            <button
              onClick={cancelRecording}
              className="text-red-500 hover:text-red-700"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="flex-1 flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-gray-600">
                {Math.floor(recordingTime / 60)
                  .toString()
                  .padStart(2, "0")}
                :{(recordingTime % 60).toString().padStart(2, "0")}
              </span>
            </div>
            <button
              onClick={stopRecording}
              className="w-10 h-10 bg-musso-pink text-white rounded-full flex items-center justify-center hover:brightness-110"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        ) : (
          // Mode normal
          <>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
              onChange={handleFileSelect}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-gray-400 hover:text-musso-pink p-1.5"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            <textarea
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Écrire un message..."
              rows={1}
              className="flex-1 resize-none border border-gray-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-musso-pink max-h-32 overflow-y-auto"
              style={{ minHeight: "40px" }}
            />

            {text.trim() || previewFile ? (
              <button
                onClick={handleSend}
                disabled={sendTextMutation.isPending || sendFileMutation.isPending}
                className="w-10 h-10 bg-musso-pink text-white rounded-full flex items-center justify-center hover:brightness-110 disabled:opacity-50 flex-shrink-0"
              >
                <Send className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={startRecording}
                className="w-10 h-10 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center hover:bg-musso-pink hover:text-white transition-colors flex-shrink-0"
              >
                <Mic className="w-5 h-5" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
