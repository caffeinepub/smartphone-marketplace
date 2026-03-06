import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Inbox, Loader2, MessageCircle, Send } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useConversation,
  useConversationSummaries,
  useMarkConversationRead,
  useReplyMessage,
  useSendMessage,
} from "../hooks/useQueries";
import type { ConversationSummary } from "../hooks/useQueries";

interface MessagesPageProps {
  onViewListing?: (id: string) => void;
  onLogin?: () => void;
}

function timeAgo(nanoTs: bigint): string {
  const ms = Number(nanoTs) / 1_000_000;
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ms).toLocaleDateString();
}

function ConversationList({
  summaries,
  selectedKey,
  onSelect,
  myPrincipal,
}: {
  summaries: ConversationSummary[];
  selectedKey: string | null;
  onSelect: (summary: ConversationSummary) => void;
  myPrincipal: string;
}) {
  if (summaries.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-16 text-center px-6"
        data-ocid="messages.empty_state"
      >
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <Inbox className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-display font-semibold text-foreground mb-1">
          No messages yet
        </h3>
        <p className="text-sm text-muted-foreground">
          When you message a seller or receive enquiries, conversations will
          appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {summaries.map((summary, idx) => {
        const key = `${summary.listingId}::${summary.otherParty.toString()}`;
        const isSelected = selectedKey === key;
        const unread = Number(summary.unreadCount);
        const isOther = summary.otherParty.toString() !== myPrincipal;
        const shortPrincipal = `${summary.otherParty.toString().slice(0, 10)}…`;

        return (
          <motion.button
            key={key}
            type="button"
            data-ocid={`messages.conversation.item.${idx + 1}`}
            onClick={() => onSelect(summary)}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`w-full text-left px-4 py-4 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              isSelected ? "bg-muted" : ""
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-sm text-foreground truncate font-display">
                    {summary.listingTitle}
                  </span>
                  {unread > 0 && (
                    <Badge
                      variant="default"
                      className="h-5 min-w-5 text-xs px-1.5 rounded-full shrink-0"
                    >
                      {unread}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-1">
                  {isOther ? `With: ${shortPrincipal}` : "Your message"}
                </p>
                <p className="text-sm text-muted-foreground truncate leading-snug">
                  {summary.lastMessage}
                </p>
              </div>
              <span className="text-xs text-muted-foreground shrink-0 mt-0.5">
                {timeAgo(summary.lastMessageAt)}
              </span>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}

function ThreadView({
  summary,
  myPrincipal,
  onBack,
  onViewListing,
}: {
  summary: ConversationSummary;
  myPrincipal: string;
  onBack: () => void;
  onViewListing?: (id: string) => void;
}) {
  const otherPartyStr = summary.otherParty.toString();
  const { data: messages = [], isLoading } = useConversation(
    summary.listingId,
    otherPartyStr,
  );
  const markRead = useMarkConversationRead();
  const sendMessage = useSendMessage();
  const replyMessage = useReplyMessage();
  const [content, setContent] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Mark as read when thread opens
  // biome-ignore lint/correctness/useExhaustiveDependencies: markRead.mutate is stable from useMutation
  useEffect(() => {
    markRead.mutate({
      listingId: summary.listingId,
      otherParty: otherPartyStr,
    });
  }, [summary.listingId, otherPartyStr]);

  // Scroll to bottom when messages change
  // biome-ignore lint/correctness/useExhaustiveDependencies: messages.length is the intentional trigger
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Determine if I am the seller (seller principal == myPrincipal)
  // We check by seeing if the "otherParty" is NOT a seller match in summary.
  // Actually, we can figure it out via messages: if sender == me and it's a reply scenario.
  // The safest approach: we are the seller if myPrincipal is one of the "seller" side.
  // Backend's replyMessage is for seller->buyer. sendMessage is buyer->seller.
  // We'll detect: if any message has sender == myPrincipal && recipient == otherPartyStr => we were the one who sent to otherParty
  // The simpler logic: if I'm the one who received the FIRST message (i.e., I am the listing owner), use replyMessage.
  const iAmSeller = messages.some(
    (m) =>
      m.recipient.toString() === myPrincipal &&
      m.sender.toString() === otherPartyStr,
  );

  const handleSend = async () => {
    const trimmed = content.trim();
    if (!trimmed) return;

    try {
      if (iAmSeller) {
        await replyMessage.mutateAsync({
          listingId: summary.listingId,
          buyer: otherPartyStr,
          content: trimmed,
        });
      } else {
        await sendMessage.mutateAsync({
          listingId: summary.listingId,
          content: trimmed,
        });
      }
      setContent("");
      // Refetch the conversation messages
      void queryClient.invalidateQueries({
        queryKey: ["conversation", summary.listingId, otherPartyStr],
      });
    } catch {
      toast.error("Failed to send message. Please try again.");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const isSending = sendMessage.isPending || replyMessage.isPending;

  return (
    <div className="flex flex-col h-full" data-ocid="messages.thread.panel">
      {/* Thread header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-background/80 backdrop-blur-sm shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 md:hidden"
          onClick={onBack}
          aria-label="Back to conversations"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <button
            type="button"
            className="font-display font-semibold text-sm text-foreground hover:text-primary transition-colors truncate block text-left"
            onClick={() => onViewListing?.(summary.listingId)}
          >
            {summary.listingTitle}
          </button>
          <p className="text-xs text-muted-foreground truncate">
            {summary.otherParty.toString().slice(0, 16)}…
          </p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}
              >
                <Skeleton className="h-10 w-48 rounded-2xl" />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <MessageCircle className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No messages in this conversation yet.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((msg) => {
              const isMe = msg.sender.toString() === myPrincipal;
              const msgTime = new Date(
                Number(msg.createdAt) / 1_000_000,
              ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

              return (
                <div
                  key={msg.id}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isMe
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted text-foreground rounded-bl-sm"
                    }`}
                  >
                    <p>{msg.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        isMe
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground"
                      }`}
                    >
                      {msgTime}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input area */}
      <div className="px-4 py-3 border-t border-border bg-background shrink-0">
        <div className="flex gap-2 items-end">
          <Textarea
            data-ocid="messages.send.input"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message… (Enter to send)"
            className="resize-none min-h-[44px] max-h-32 text-sm"
            rows={1}
          />
          <Button
            data-ocid="messages.send.button"
            size="icon"
            onClick={handleSend}
            disabled={!content.trim() || isSending}
            className="shrink-0 h-10 w-10"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function MessagesPage({ onViewListing, onLogin }: MessagesPageProps) {
  const { identity, login } = useInternetIdentity();
  const myPrincipal = identity?.getPrincipal().toString();
  const isAuthenticated = !!identity;

  const { data: summaries = [], isLoading } = useConversationSummaries();
  const [selectedSummary, setSelectedSummary] =
    useState<ConversationSummary | null>(null);

  const selectedKey = selectedSummary
    ? `${selectedSummary.listingId}::${selectedSummary.otherParty.toString()}`
    : null;

  const handleSelectConversation = (summary: ConversationSummary) => {
    setSelectedSummary(summary);
  };

  const handleBack = () => setSelectedSummary(null);

  if (!isAuthenticated) {
    return (
      <div
        className="max-w-2xl mx-auto px-4 sm:px-6 py-20 text-center"
        data-ocid="messages.page"
      >
        <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Inbox className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-2xl font-bold font-display text-foreground mb-2">
          Your Inbox
        </h1>
        <p className="text-muted-foreground mb-8">
          Sign in to view your messages and conversations with buyers and
          sellers.
        </p>
        <Button
          onClick={onLogin ?? login}
          data-ocid="messages.login.button"
          size="lg"
        >
          Sign In to View Messages
        </Button>
      </div>
    );
  }

  return (
    <div
      className="max-w-5xl mx-auto px-4 sm:px-6 py-6"
      data-ocid="messages.page"
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-display text-foreground">
          Inbox
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your conversations with buyers and sellers
        </p>
      </div>

      <div className="border border-border rounded-xl overflow-hidden bg-card shadow-sm min-h-[520px] flex">
        {/* Conversation list — hidden on mobile when thread selected */}
        <div
          className={`w-full md:w-80 md:min-w-[280px] border-r border-border flex flex-col ${
            selectedSummary ? "hidden md:flex" : "flex"
          }`}
        >
          <div className="px-4 py-3 border-b border-border bg-muted/30">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Conversations
            </p>
          </div>
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <ScrollArea className="flex-1">
              <ConversationList
                summaries={summaries}
                selectedKey={selectedKey}
                onSelect={handleSelectConversation}
                myPrincipal={myPrincipal ?? ""}
              />
            </ScrollArea>
          )}
        </div>

        {/* Thread panel */}
        <div
          className={`flex-1 flex flex-col ${
            selectedSummary ? "flex" : "hidden md:flex"
          }`}
        >
          <AnimatePresence mode="wait">
            {selectedSummary ? (
              <motion.div
                key={`${selectedSummary.listingId}::${selectedSummary.otherParty.toString()}`}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col flex-1 h-full"
                style={{ minHeight: 0 }}
              >
                <ThreadView
                  summary={selectedSummary}
                  myPrincipal={myPrincipal ?? ""}
                  onBack={handleBack}
                  onViewListing={onViewListing}
                />
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center flex-1 text-center p-8"
              >
                <MessageCircle className="h-12 w-12 text-muted-foreground mb-3" />
                <h3 className="font-display font-semibold text-foreground mb-1">
                  Select a conversation
                </h3>
                <p className="text-sm text-muted-foreground">
                  Choose a conversation from the list to view messages.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
