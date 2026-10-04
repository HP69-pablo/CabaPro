"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "@/i18n/navigation";
import { 
  subscribeToConversations, 
  subscribeToMessages, 
  sendMessage, 
  updateOfferStatus, 
  ConversationItem, 
  MessageItem 
} from "@/lib/firestore";
import { TransactionService } from "@/lib/transactions/transactionService";
import { 
  MessageSquare, 
  Send, 
  Loader2, 
  ArrowLeft, 
  Check, 
  X, 
  Package, 
  Plane, 
  Tag, 
  CheckCircle2, 
  XCircle,
  Clock,
  Shield
} from "lucide-react";

function MessagesContent() {
  const t = useTranslations("chat");
  const tCommon = useTranslations("common");
  const searchParams = useSearchParams();
  const initialConvId = searchParams.get("id");

  const { user, loading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(initialConvId);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [textInput, setTextInput] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  // Offer modal / toggle
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [offerProductPrice, setOfferProductPrice] = useState("");
  const [offerReward, setOfferReward] = useState("");
  const [updatingOfferId, setUpdatingOfferId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to user conversations
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToConversations(user.uid, (list) => {
      setConversations(list);
      // If we had no selection, select first or initial
      if (!selectedConvId && list.length > 0) {
        setSelectedConvId(initialConvId || list[0].id);
      }
    });
    return () => unsubscribe();
  }, [user]);

  // If initialConvId changes from URL
  useEffect(() => {
    if (initialConvId) {
      setSelectedConvId(initialConvId);
    }
  }, [initialConvId]);

  // Subscribe to messages of active conversation
  useEffect(() => {
    if (!selectedConvId) {
      setMessages([]);
      return;
    }

    setLoadingMessages(true);
    const unsubscribe = subscribeToMessages(selectedConvId, (msgs) => {
      setMessages(msgs);
      setLoadingMessages(false);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    });

    return () => unsubscribe();
  }, [selectedConvId]);

  const activeConversation = conversations.find((c) => c.id === selectedConvId);

  // Helper to get the other participant's details
  const getOtherParticipant = (conv?: ConversationItem) => {
    if (!conv || !user) return { name: "User", photoURL: null };
    const otherId = conv.participants.find((id) => id !== user.uid);
    if (!otherId || !conv.participantDetails?.[otherId]) {
      return { name: "User", photoURL: null };
    }
    return conv.participantDetails[otherId];
  };

  const handleSendText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || !selectedConvId || !user) return;

    const messageText = textInput.trim();
    setTextInput("");
    setSending(true);

    try {
      await sendMessage(selectedConvId, {
        senderId: user.uid,
        senderName: user.displayName || user.email?.split("@")[0] || "User",
        text: messageText,
        type: "text",
      });
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  };

  const handleSendOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConvId || !user) return;

    const price = Number(offerProductPrice);
    const reward = Number(offerReward);

    if (isNaN(price) || isNaN(reward) || price <= 0 || reward <= 0) return;

    setSending(true);
    try {
      await sendMessage(selectedConvId, {
        senderId: user.uid,
        senderName: user.displayName || user.email?.split("@")[0] || "User",
        text: `Proposed an offer: €${price} product + €${reward} reward`,
        type: "offer",
        offer: {
          productPrice: price,
          reward: reward,
          currency: "EUR",
          status: "pending",
        },
      });

      setShowOfferForm(false);
      setOfferProductPrice("");
      setOfferReward("");
    } catch (err) {
      console.error("Failed to send offer:", err);
    } finally {
      setSending(false);
    }
  };

  const handleOfferAction = async (messageId: string, action: "accepted" | "declined") => {
    if (!selectedConvId || !user) return;
    setUpdatingOfferId(messageId);
    try {
      await updateOfferStatus(selectedConvId, messageId, action);
      if (action === "accepted" && activeConversation) {
        const msg = messages.find((m) => m.id === messageId);
        if (msg && msg.offer) {
          const otherUid = activeConversation.participants.find((p) => p !== user.uid) || "traveler";
          const otherDetails = activeConversation.participantDetails?.[otherUid];
          await TransactionService.createTransactionFromOffer({
            conversationId: selectedConvId,
            requestId: activeConversation.requestId || undefined,
            requestTitle: activeConversation.requestTitle || "Item Request",
            productName: activeConversation.requestTitle || "Item Request",
            tripId: activeConversation.tripId || undefined,
            tripRoute: activeConversation.tripRoute || "International → Algeria",
            buyerId: user.uid,
            buyerName: user.displayName || user.email?.split("@")[0] || "Buyer",
            bringerId: otherUid,
            bringerName: otherDetails?.name || "Traveler",
            productPriceEur: msg.offer.productPrice,
            bringerFeeEur: msg.offer.reward,
          });
        }
      }
    } catch (err) {
      console.error("Failed to update offer:", err);
    } finally {
      setUpdatingOfferId(null);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-brand-accent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <p className="text-slate-500 mb-4">{t("noMessages")}</p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-teal px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-teal-800 transition"
          >
            {tCommon("login" as any) || "Sign In"}
          </Link>
        </div>
      </div>
    );
  }

  const otherUser = getOtherParticipant(activeConversation);

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 max-w-5xl">
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs h-[calc(100vh-140px)] min-h-[500px] flex">
        
        {/* Left column: Conversation list */}
        <div className={`w-full md:w-80 border-e border-slate-200 flex flex-col ${selectedConvId ? "hidden md:flex" : "flex"}`}>
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h1 className="text-lg font-bold text-slate-900">{t("title")}</h1>
            <span className="text-xs bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-full">
              {conversations.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
            {conversations.length === 0 ? (
              <div className="text-center p-8 text-slate-400">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs">{t("noMessages")}</p>
              </div>
            ) : (
              conversations.map((conv) => {
                const other = getOtherParticipant(conv);
                const isSelected = conv.id === selectedConvId;

                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConvId(conv.id)}
                    className={`w-full text-start p-3.5 flex items-start gap-3 hover:bg-slate-50 transition ${
                      isSelected ? "bg-brand-teal-50/60 border-s-4 border-brand-accent" : ""
                    }`}
                  >
                    {other.photoURL ? (
                      <img src={other.photoURL} alt="" className="h-10 w-10 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-brand-teal-100 text-brand-accent font-semibold flex items-center justify-center shrink-0 text-sm">
                        {other.name?.[0]?.toUpperCase() || "U"}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900 text-sm truncate">{other.name}</span>
                      </div>
                      
                      {conv.requestTitle && (
                        <div className="flex items-center gap-1 text-[11px] text-brand-accent truncate mt-0.5">
                          <Package className="h-3 w-3 shrink-0" />
                          <span className="truncate">{conv.requestTitle}</span>
                        </div>
                      )}

                      {conv.tripRoute && (
                        <div className="flex items-center gap-1 text-[11px] text-brand-coral truncate mt-0.5">
                          <Plane className="h-3 w-3 shrink-0" />
                          <span className="truncate">{conv.tripRoute}</span>
                        </div>
                      )}

                      <p className="text-xs text-slate-400 truncate mt-1">
                        {conv.lastMessage || "Started conversation"}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right column: Active conversation */}
        <div className={`flex-1 flex flex-col bg-slate-50/40 ${!selectedConvId ? "hidden md:flex" : "flex"}`}>
          {activeConversation ? (
            <>
              {/* Header matching Mockup Screen 3 */}
              <div className="p-3.5 bg-brand-teal text-white flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedConvId(null)}
                    className="md:hidden p-1.5 text-white/80 hover:bg-[#ffffff]/10 rounded-lg"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>

                  <div className="relative">
                    {otherUser.photoURL ? (
                      <img src={otherUser.photoURL} alt="" className="h-9 w-9 rounded-full object-cover ring-2 ring-white/30" />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-[#ffffff]/20 text-white font-bold flex items-center justify-center text-sm ring-2 ring-white/30">
                        {otherUser.name?.[0]?.toUpperCase() || "U"}
                      </div>
                    )}
                    <span className="absolute bottom-0 end-0 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-brand-accent" />
                  </div>

                  <div>
                    <h2 className="font-bold text-white text-sm">{otherUser.name}</h2>
                    <div className="flex items-center gap-1.5 text-[11px] text-teal-100">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                      <span>Online</span>
                      {activeConversation.requestTitle && (
                        <span className="truncate max-w-[150px] text-teal-200">
                          • {activeConversation.requestTitle}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Make offer button toggle */}
                <button
                  onClick={() => setShowOfferForm(!showOfferForm)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-brand-accent hover:bg-brand-teal-50 shadow-sm transition"
                >
                  <Tag className="h-3.5 w-3.5" />
                  <span>{t("makeOffer")}</span>
                </button>
              </div>

              {/* Offer Proposal Form Dropdown */}
              {showOfferForm && (
                <div className="p-4 bg-emerald-50/70 border-b border-emerald-200">
                  <form onSubmit={handleSendOffer} className="space-y-3 max-w-md mx-auto">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-900 uppercase tracking-wide">
                        {t("makeOffer")}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowOfferForm(false)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          {t("offerPrice")} (€)
                        </label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={offerProductPrice}
                          onChange={(e) => setOfferProductPrice(e.target.value)}
                          placeholder="e.g. 120"
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          {t("offerReward")} (€)
                        </label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={offerReward}
                          onChange={(e) => setOfferReward(e.target.value)}
                          placeholder="e.g. 35"
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowOfferForm(false)}
                        className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded-md"
                      >
                        {tCommon("cancel")}
                      </button>
                      <button
                        type="submit"
                        disabled={sending}
                        className="px-4 py-1 text-xs font-semibold bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {sending ? tCommon("loading") : t("sendOffer")}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Messages Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-brand-accent" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <MessageSquare className="h-10 w-10 text-slate-300 mb-2" />
                    <p className="text-xs">{t("noMessages")}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Say hello and discuss item details</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMine = msg.senderId === user.uid;
                    const isSystem = msg.type === "system";
                    const isOffer = msg.type === "offer" && msg.offer;

                    if (isSystem) {
                      return (
                        <div key={msg.id} className="text-center my-2">
                          <span className="inline-block text-[11px] bg-slate-100 text-slate-600 font-medium px-3 py-1 rounded-full border border-slate-200">
                            {msg.text}
                          </span>
                        </div>
                      );
                    }

                    if (isOffer) {
                      const offer = msg.offer!;
                      const total = offer.productPrice + offer.reward;
                      const isPending = offer.status === "pending";
                      const isAccepted = offer.status === "accepted";
                      const isDeclined = offer.status === "declined";

                      return (
                        <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"} my-2`}>
                          <div className={`w-full max-w-xs sm:max-w-sm rounded-2xl p-4 shadow-sm border ${
                            isAccepted 
                              ? "bg-emerald-50 border-emerald-300"
                              : isDeclined
                              ? "bg-slate-50 border-slate-200 opacity-70"
                              : "bg-brand-teal-50 border-brand-accent/25"
                          }`}>
                            <div className="flex items-center justify-between gap-2 border-b border-brand-accent/15 pb-2 mb-2">
                              <span className="text-xs font-extrabold text-brand-accent flex items-center gap-1.5">
                                <Shield className="h-4 w-4 text-brand-accent" />
                                Offer
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isAccepted 
                                  ? "bg-emerald-100 text-emerald-800"
                                  : isDeclined
                                  ? "bg-red-100 text-red-700"
                                  : "bg-brand-teal-100 text-brand-accent"
                              }`}>
                                {isAccepted ? t("offerAccepted") : isDeclined ? t("offerDeclined") : "Pending"}
                              </span>
                            </div>

                            <div className="space-y-1.5 text-xs text-slate-700 mb-3.5">
                              <div className="flex justify-between">
                                <span className="text-slate-500">Item:</span>
                                <span className="font-bold text-slate-900 line-clamp-1">{activeConversation?.requestTitle || "iPhone 13"}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Price:</span>
                                <span className="font-bold text-slate-900">€{offer.productPrice}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Reward:</span>
                                <span className="font-bold text-brand-accent">€{offer.reward}</span>
                              </div>
                            </div>

                            {/* Action buttons matching Screen 3 */}
                            {!isMine && isPending && (
                              <div className="space-y-2 pt-1 border-t border-brand-accent/10">
                                <button
                                  onClick={() => handleOfferAction(msg.id, "accepted")}
                                  disabled={updatingOfferId === msg.id}
                                  className="w-full inline-flex items-center justify-center gap-1.5 bg-brand-teal text-white rounded-xl py-2 text-xs font-bold hover:bg-brand-teal-800 transition shadow-sm"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  {t("acceptOffer") || "Accept Offer"}
                                </button>
                                <button
                                  onClick={() => handleOfferAction(msg.id, "declined")}
                                  disabled={updatingOfferId === msg.id}
                                  className="w-full inline-flex items-center justify-center gap-1.5 border border-brand-accent text-brand-accent rounded-xl py-2 text-xs font-bold hover:bg-brand-teal-50 transition"
                                >
                                  <X className="h-3.5 w-3.5" />
                                  {t("declineOffer") || "Modify Offer"}
                                </button>
                              </div>
                            )}

                            {isAccepted && (
                              <div className="pt-2 border-t border-emerald-200">
                                <Link
                                  href="/dashboard?tab=orders"
                                  className="w-full inline-flex items-center justify-center gap-1.5 bg-emerald-600 text-white rounded-xl py-2 text-xs font-bold hover:bg-emerald-700 transition shadow-sm"
                                >
                                  <Shield className="h-3.5 w-3.5" />
                                  Suivre le Paiement & Livraison
                                </Link>
                              </div>
                            )}

                            {isMine && isPending && (
                              <div className="text-[11px] text-slate-500 italic text-center bg-white/60 py-1.5 rounded-lg border border-brand-accent/10">
                                Awaiting response from {otherUser.name}...
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm shadow-xs ${
                            isMine
                              ? "bg-brand-teal text-white rounded-br-xs"
                              : "bg-white text-slate-800 border border-brand-border rounded-bl-xs"
                          }`}
                        >
                          <p className="leading-relaxed break-words">{msg.text}</p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input bar matching Screen 3 */}
              <form onSubmit={handleSendText} className="p-3 border-t border-brand-border bg-white flex items-center gap-2">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={t("typeMessage")}
                  className="flex-1 rounded-2xl border border-brand-border bg-brand-bg/50 px-4 py-2.5 text-xs sm:text-sm focus:border-brand-accent focus:ring-1 focus:ring-brand-accent outline-none"
                />
                <button
                  type="submit"
                  disabled={sending || !textInput.trim()}
                  className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-brand-teal text-white hover:bg-brand-teal-800 disabled:opacity-40 transition shadow-sm"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8">
              <MessageSquare className="h-12 w-12 text-slate-300 mb-3" />
              <p className="text-sm font-medium text-slate-500">Select a conversation</p>
              <p className="text-xs text-slate-400 mt-1">Or contact a buyer/traveler from the marketplace</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[500px]">
          <Loader2 className="h-6 w-6 animate-spin text-brand-accent" />
        </div>
      }
    >
      <MessagesContent />
    </Suspense>
  );
}

