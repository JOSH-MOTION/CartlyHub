"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Loader2, MessageCircle, Send } from "lucide-react";
import { doc, onSnapshot, collection, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useApp } from "@/context/AppContext";
import Navbar from "@/components/Navbar";
import { apiFetch } from "@/utils/apiClient";
import ThreadThumbnail from "@/components/ThreadThumbnail";

export default function ThreadPage({ params }) {
  const { user, isLoading: authLoading } = useApp();
  const router = useRouter();
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [thread, setThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/account/signin");
  }, [user, authLoading, router]);

  // Live listeners, not polling — Firestore only bills the initial read plus
  // whatever actually changes, instead of re-reading the whole conversation
  // on a timer.
  useEffect(() => {
    if (!user) return undefined;

    const unsubThread = onSnapshot(doc(db, "messageThreads", params.id), (snap) => {
      setThread(snap.exists() ? { id: snap.id, ...snap.data() } : null);
      setIsLoading(false);
    });

    const unsubMessages = onSnapshot(
      query(collection(db, "threadMessages"), where("threadId", "==", params.id)),
      (snap) => {
        const list = snap.docs
          .map((entry) => ({ id: entry.id, ...entry.data() }))
          .sort((a, b) => (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0));
        setMessages(list);
      },
    );

    return () => {
      unsubThread();
      unsubMessages();
    };
  }, [user, params.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || isSending) return;
    setIsSending(true);
    try {
      await apiFetch(`/api/messages/${params.id}/send`, { method: "POST", body: { text } });
      setText("");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSending(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-black" />
      </div>
    );
  }

  const currentUserId = user?.id;
  const isSeller = currentUserId === thread?.sellerId;
  const otherName = isSeller ? thread?.customerName : thread?.sellerStoreName;
  const whatsappHref =
    !isSeller && thread?.sellerWhatsapp
      ? `https://wa.me/${thread.sellerWhatsapp.replace(/[^\d]/g, "")}?text=${encodeURIComponent(
          `Hi! Continuing our chat on Cartly Hub about your status.`,
        )}`
      : null;

  return (
    <div className="h-screen flex flex-col bg-gray-50 font-sans">
      <Navbar />

      <div className="flex-1 flex flex-col max-w-2xl w-full mx-auto overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 shrink-0">
          <button onClick={() => router.push("/messages")} aria-label="Back to messages" className="p-1">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <ThreadThumbnail src={thread?.statusImage} className="h-9 w-9 rounded-xl border border-gray-100" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black truncate">{otherName}</p>
            {thread?.statusCaption && <p className="text-[10px] text-gray-400 truncate">{thread.statusCaption}</p>}
          </div>
          {whatsappHref && (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-[#25D366] text-white px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shrink-0"
            >
              <MessageCircle className="h-3 w-3" />
              WhatsApp
            </a>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <p className="text-center text-xs text-gray-400 font-bold mt-8">Say hello — start the conversation.</p>
          ) : (
            messages.map((message) => {
              const isMine = message.senderId === currentUserId;
              return (
                <div key={message.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                      isMine ? "bg-black text-white rounded-br-md" : "bg-white border border-gray-100 rounded-bl-md"
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSend} className="flex items-center gap-2 p-4 bg-white border-t border-gray-100 shrink-0">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message…"
            className="flex-1 px-4 py-3 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-black outline-none text-sm font-medium"
          />
          <button
            type="submit"
            disabled={isSending || !text.trim()}
            className="h-11 w-11 bg-black text-white rounded-2xl flex items-center justify-center disabled:opacity-50 shrink-0"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
