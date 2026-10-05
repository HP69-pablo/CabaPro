"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Building2,
  Send,
  Users,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Search,
  Key,
  DollarSign,
  Lock,
  Plus,
  RefreshCw,
  Eye,
  Camera,
  Check,
  X,
  CreditCard,
  UserCheck,
} from "lucide-react";
import { PARTNER_BUREAUS, STAFF_CREDENTIALS } from "@/lib/transactions/constants";
import { Transaction, LedgerEntry, AuditLogEntry } from "@/lib/transactions/types";
import { TransactionService } from "@/lib/transactions/transactionService";
import { DemoSimulator, DEMO_PERSONAS, DEMO_TRANSACTION_ID } from "@/lib/transactions/demoSimulator";
import { Link } from "@/i18n/navigation";

interface StaffAccount {
  id: string;
  name: string;
  email: string;
  role: "admin" | "finance" | "bureau_staff" | "moderator";
  bureauName?: string;
  pin: string;
  createdAt: string;
}

interface StaffControlCenterProps {
  defaultRole?: "admin" | "finance" | "bureau_staff" | "moderator";
}

export default function StaffControlCenter({ defaultRole = "admin" }: StaffControlCenterProps = {}) {
  // Authentication & PIN gate
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [selectedDeskId, setSelectedDeskId] = useState<string>(
    defaultRole === "bureau_staff" ? "bureau_alger" : defaultRole
  );
  const [pinInput, setPinInput] = useState<string>("");
  const [pinError, setPinError] = useState<string | null>(null);

  // Current active staff session
  const [activeRole, setActiveRole] = useState<"admin" | "finance" | "bureau_staff" | "moderator">(defaultRole);
  const [currentStaffName, setCurrentStaffName] = useState(
    defaultRole === "admin"
      ? STAFF_CREDENTIALS.ADMIN.name
      : defaultRole === "finance"
      ? STAFF_CREDENTIALS.FINANCE.name
      : defaultRole === "bureau_staff"
      ? STAFF_CREDENTIALS.BUREAU_ALGER.name
      : STAFF_CREDENTIALS.MODERATOR.name
  );
  const [staffTab, setStaffTab] = useState<"bureau_desk" | "wires" | "disputes" | "accounts" | "ledger">("bureau_desk");

  // State data
  const [tx, setTx] = useState<Transaction | null>(null);
  const [searchCode, setSearchCode] = useState("");
  const [receivedAmount, setReceivedAmount] = useState<number>(0);
  const [idChecked, setIdChecked] = useState(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Admin staff account creation form
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffEmail, setNewStaffEmail] = useState("");
  const [newStaffRole, setNewStaffRole] = useState<"bureau_staff" | "finance" | "moderator" | "admin">("bureau_staff");
  const [newStaffBureau, setNewStaffBureau] = useState(PARTNER_BUREAUS[0].id);
  const [newStaffPin, setNewStaffPin] = useState("1234");
  const [createdStaffList, setCreatedStaffList] = useState<StaffAccount[]>([
    {
      id: "staff-1",
      name: STAFF_CREDENTIALS.BUREAU_ALGER.name,
      email: STAFF_CREDENTIALS.BUREAU_ALGER.email,
      role: "bureau_staff",
      bureauName: "Bureau Central Alger",
      pin: STAFF_CREDENTIALS.BUREAU_ALGER.pin,
      createdAt: "2026-09-15",
    },
    {
      id: "staff-2",
      name: STAFF_CREDENTIALS.FINANCE.name,
      email: STAFF_CREDENTIALS.FINANCE.email,
      role: "finance",
      pin: STAFF_CREDENTIALS.FINANCE.pin,
      createdAt: "2026-09-01",
    },
    {
      id: "staff-3",
      name: STAFF_CREDENTIALS.MODERATOR.name,
      email: STAFF_CREDENTIALS.MODERATOR.email,
      role: "moderator",
      pin: STAFF_CREDENTIALS.MODERATOR.pin,
      createdAt: "2026-09-10",
    },
  ]);

  // Ledger & audit records
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  // Wire creation inputs
  const [wireRef, setWireRef] = useState("SEPA-884920");
  const [disputeVerdict, setDisputeVerdict] = useState<"FULL_REFUND" | "PARTIAL_REFUND" | "RELEASE_BRINGER">("PARTIAL_REFUND");
  const [verdictNotes, setVerdictNotes] = useState("Accord amiable après médiation et inspection.");

  // All active transactions
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);

  const loadAllTransactions = async () => {
    try {
      const list = await TransactionService.getAllTransactions();
      setAllTransactions(list);
    } catch (e) {
      console.warn("loadAllTransactions error:", e);
    }
  };

  // Load transactions on mount
  useEffect(() => {
    DemoSimulator.getOrCreateDemoTransaction().then((demo) => {
      setTx(demo);
      setReceivedAmount(demo.priceBreakdown.totalDzd);
      setSearchCode(demo.paymentCode);
      refreshRecords(demo.id);
      loadAllTransactions();
    });
  }, []);

  const refreshRecords = async (txId: string) => {
    const l = await TransactionService.getLedgerEntries(txId);
    const a = await TransactionService.getAuditLogs(txId);
    setLedgerEntries(l);
    setAuditLogs(a);
  };

  const handleRoleSwitch = (role: "admin" | "finance" | "bureau_staff" | "moderator") => {
    setActiveRole(role);
    if (role === "admin") setCurrentStaffName(STAFF_CREDENTIALS.ADMIN.name);
    else if (role === "finance") setCurrentStaffName(STAFF_CREDENTIALS.FINANCE.name);
    else if (role === "bureau_staff") setCurrentStaffName(STAFF_CREDENTIALS.BUREAU_ALGER.name);
    else setCurrentStaffName(STAFF_CREDENTIALS.MODERATOR.name);
  };

  const handlePinLogin = (deskId: string, pin: string) => {
    setPinError(null);
    if (deskId === "admin" && pin === STAFF_CREDENTIALS.ADMIN.pin) {
      setActiveRole("admin");
      setCurrentStaffName(STAFF_CREDENTIALS.ADMIN.name);
      setStaffTab("bureau_desk");
      setIsAuthenticated(true);
      return;
    }
    if (deskId === "finance" && pin === STAFF_CREDENTIALS.FINANCE.pin) {
      setActiveRole("finance");
      setCurrentStaffName(STAFF_CREDENTIALS.FINANCE.name);
      setStaffTab("wires");
      setIsAuthenticated(true);
      return;
    }
    if (deskId === "bureau_alger" && pin === STAFF_CREDENTIALS.BUREAU_ALGER.pin) {
      setActiveRole("bureau_staff");
      setCurrentStaffName(STAFF_CREDENTIALS.BUREAU_ALGER.name);
      setStaffTab("bureau_desk");
      setIsAuthenticated(true);
      return;
    }
    if (deskId === "moderator" && pin === STAFF_CREDENTIALS.MODERATOR.pin) {
      setActiveRole("moderator");
      setCurrentStaffName(STAFF_CREDENTIALS.MODERATOR.name);
      setStaffTab("disputes");
      setIsAuthenticated(true);
      return;
    }

    const custom = createdStaffList.find((s) => s.id === deskId);
    if (custom && custom.pin === pin) {
      setActiveRole(custom.role);
      setCurrentStaffName(custom.name);
      setStaffTab(custom.role === "finance" ? "wires" : custom.role === "moderator" ? "disputes" : "bureau_desk");
      setIsAuthenticated(true);
      return;
    }

    setPinError("Code PIN invalide pour ce bureau. Veuillez réessayer.");
  };

  // Real Dossier Lookup
  const handleSearchDossier = async (codeToSearch?: string) => {
    const query = (codeToSearch || searchCode).trim();
    if (!query) return;
    setActionError(null);
    setActionSuccess(null);
    const found = await TransactionService.getTransactionByPaymentCode(query);
    if (found) {
      setTx(found);
      setSearchCode(found.paymentCode);
      setReceivedAmount(found.priceBreakdown.totalDzd);
      await refreshRecords(found.id);
      await loadAllTransactions();
      setActionSuccess(`Dossier #${found.paymentCode} chargé avec succès.`);
    } else {
      setActionError(`Aucun dossier trouvé pour la référence "${query}".`);
    }
  };

  // 1. Bureau Cash confirmation
  const handleConfirmCashPayment = async () => {
    if (!tx) return;
    setActionError(null);
    try {
      const updated = await TransactionService.recordBureauPayment({
        transactionId: tx.id,
        receivedAmountDzd: receivedAmount,
        staffId: "staff-mustapha-001",
        staffName: currentStaffName,
        idChecked,
        receiptPhotoUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400",
      });
      setTx(updated);
      await refreshRecords(updated.id);
      await loadAllTransactions();
      setActionSuccess(`Encaissement de ${receivedAmount.toLocaleString()} DZD validé avec succès ! Code secret 6 chiffres généré.`);
    } catch (err: any) {
      setActionError(err.message || "Erreur de validation");
    }
  };

  // 2. Dispatch wire
  const handleDispatchWire = async () => {
    if (!tx) return;
    setActionError(null);
    try {
      const updated = await TransactionService.initiateFundsTransfer({
        transactionId: tx.id,
        method: "bank_wire",
        transferRef: wireRef,
        staffId: "staff-bureau",
        staffName: currentStaffName,
      });
      setTx(updated);
      await refreshRecords(updated.id);
      setActionSuccess(`Virement international de €${updated.priceBreakdown.productPrice} enregistré!`);
    } catch (err: any) {
      setActionError(err.message || "Erreur virement");
    }
  };

  // 3. Dual-control approval
  const handleApproveDualControl = async () => {
    if (!tx) return;
    setActionError(null);
    try {
      const updated = await TransactionService.approveDualControlTransfer({
        transactionId: tx.id,
        financeAdminId: "admin-amine",
        financeAdminName: currentStaffName,
      });
      setTx(updated);
      await refreshRecords(updated.id);
      setActionSuccess("Autorisation double contrôle Finance accordée! Virement débloqué.");
    } catch (err: any) {
      setActionError(err.message || "Erreur autorisation");
    }
  };

  // 4. Resolve dispute
  const handleResolveDispute = async () => {
    if (!tx) return;
    setActionError(null);
    try {
      const updated = await TransactionService.resolveDispute({
        transactionId: tx.id,
        moderatorId: "mod-samira",
        moderatorName: currentStaffName,
        resolution: disputeVerdict,
        moderatorNotes: verdictNotes,
      });
      setTx(updated);
      await refreshRecords(updated.id);
      setActionSuccess(`Verdict modération appliqué: ${disputeVerdict}`);
    } catch (err: any) {
      setActionError(err.message || "Erreur litige");
    }
  };

  // 5. Create new staff account
  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName || !newStaffEmail) return;

    const bureau = PARTNER_BUREAUS.find((b) => b.id === newStaffBureau);
    const newAccount: StaffAccount = {
      id: `staff-${Date.now()}`,
      name: newStaffName,
      email: newStaffEmail,
      role: newStaffRole,
      bureauName: newStaffRole === "bureau_staff" ? bureau?.name : undefined,
      pin: newStaffPin,
      createdAt: new Date().toISOString().split("T")[0],
    };

    setCreatedStaffList((prev) => [newAccount, ...prev]);
    setNewStaffName("");
    setNewStaffEmail("");
    setActionSuccess(`Compte personnel créé avec succès pour ${newStaffName} (${newStaffRole})!`);
  };

  if (!isAuthenticated) {
    const currentDefaultPin =
      selectedDeskId === "admin"
        ? STAFF_CREDENTIALS.ADMIN.pin
        : selectedDeskId === "bureau_alger"
        ? STAFF_CREDENTIALS.BUREAU_ALGER.pin
        : selectedDeskId === "finance"
        ? STAFF_CREDENTIALS.FINANCE.pin
        : selectedDeskId === "moderator"
        ? STAFF_CREDENTIALS.MODERATOR.pin
        : createdStaffList.find((s) => s.id === selectedDeskId)?.pin || "----";

    return (
      <div className="min-h-[calc(100vh-56px)] bg-brand-bg flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl border border-brand-border p-6 sm:p-8 shadow-xl">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-teal text-white shadow-md shadow-brand-teal/20">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              Portail Staff & Administration
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Authentification sécurisée par code PIN d&apos;agent pour accéder aux opérations de caisse, virements et litiges Caba Pro.
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handlePinLogin(selectedDeskId, pinInput);
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Sélectionner le Poste / Bureau
              </label>
              <select
                value={selectedDeskId}
                onChange={(e) => {
                  setSelectedDeskId(e.target.value);
                  setPinError(null);
                }}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:border-brand-teal focus:ring-1 focus:ring-brand-teal outline-none transition"
              >
                <optgroup label="Postes Officiels Caba Pro">
                  <option value="admin">Direction Générale (Admin - admin@cabapro.dz)</option>
                  <option value="bureau_alger">Guichet Caisse Alger (Mustapha K. - Alger Centre)</option>
                  <option value="finance">Direction Financière (Double Contrôle - finance@cabapro.dz)</option>
                  <option value="moderator">Service Modération & Litiges (moderation@cabapro.dz)</option>
                </optgroup>
                {createdStaffList.length > 0 && (
                  <optgroup label="Comptes Personnels Enregistrés">
                    {createdStaffList.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} ({st.role.toUpperCase()})
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Code PIN d&apos;accès
                </label>
                <span className="text-[11px] text-brand-accent font-semibold font-mono">
                  PIN par défaut: {currentDefaultPin}
                </span>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  maxLength={6}
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    if (pinError) setPinError(null);
                  }}
                  placeholder={`Entrez ${currentDefaultPin}`}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-mono tracking-widest text-slate-900 focus:border-brand-teal focus:ring-1 focus:ring-brand-teal outline-none transition"
                  autoFocus
                />
              </div>
            </div>

            {pinError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{pinError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-2xl bg-brand-teal py-3 text-xs font-bold text-white hover:bg-brand-teal-800 transition flex items-center justify-center gap-2 shadow-md shadow-brand-teal/20"
            >
              <Key className="h-4 w-4" />
              Déverrouiller le Poste
            </button>
          </form>

          {/* Authorized Staff Note */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400">
              Postes autorisés : <span className="font-mono font-bold text-slate-600">Admin (9900)</span> • <span className="font-mono font-bold text-slate-600">Alger (1600)</span> • <span className="font-mono font-bold text-slate-600">Finance (8800)</span> • <span className="font-mono font-bold text-slate-600">Litiges (7700)</span>
            </p>
          </div>

          <div className="mt-6 text-center">
            <Link href="/" className="text-xs text-slate-400 hover:text-slate-600 transition inline-flex items-center gap-1">
              ← Retour à l&apos;accueil Caba Pro
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg py-8 px-4 sm:px-6 max-w-7xl mx-auto">
      {/* Header with security badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-white p-6 rounded-3xl border border-brand-border shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-8 w-8 rounded-xl bg-brand-teal text-white flex items-center justify-center font-bold">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              Centre de Contrôle Staff & Bureaux Partenaires
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Interface certifiée pour agents de bureau en Algérie, direction financière et modération Caba Pro.
          </p>
        </div>

        {/* Role & Credential Switcher */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <button
            onClick={() => handleRoleSwitch("admin")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeRole === "admin"
                ? "bg-brand-teal text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Key className="h-3.5 w-3.5" />
            Admin
          </button>
          <button
            onClick={() => handleRoleSwitch("bureau_staff")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeRole === "bureau_staff"
                ? "bg-brand-teal text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            Agent Bureau (Alger)
          </button>
          <button
            onClick={() => handleRoleSwitch("finance")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeRole === "finance"
                ? "bg-brand-teal text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <DollarSign className="h-3.5 w-3.5" />
            Finance (Double Contrôle)
          </button>
          <button
            onClick={() => handleRoleSwitch("moderator")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeRole === "moderator"
                ? "bg-brand-teal text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            Litiges
          </button>

          <button
            onClick={() => {
              setIsAuthenticated(false);
              setPinInput("");
              setPinError(null);
            }}
            className="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 border border-slate-200 hover:border-red-200"
            title="Verrouiller la session et quitter le bureau"
          >
            <Lock className="h-3.5 w-3.5" />
            Verrouiller
          </button>
        </div>
      </div>

      {/* Banner / Current active agent context */}
      <div className="mb-6 flex items-center justify-between bg-brand-teal-50 border border-brand-accent/20 rounded-2xl p-4 text-xs">
        <div className="flex items-center gap-2">
          <UserCheck className="h-4 w-4 text-brand-accent" />
          <span className="text-slate-700">
            Connecté en tant que: <strong className="text-brand-accent">{currentStaffName}</strong> (Rôle: <strong>{activeRole.toUpperCase()}</strong>)
          </span>
        </div>
        <span className="font-mono text-[11px] bg-white px-2.5 py-1 rounded-lg border border-brand-accent/20 text-brand-accent font-bold">
          Code Accès: {STAFF_CREDENTIALS[activeRole === "admin" ? "ADMIN" : activeRole === "bureau_staff" ? "BUREAU_ALGER" : activeRole === "finance" ? "FINANCE" : "MODERATOR"].pin}
        </span>
      </div>

      {/* Feedback alerts */}
      {actionSuccess && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {actionError && (
        <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-red-600 hover:text-red-800">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Navigation Desks */}
      <div className="flex border-b border-brand-border mb-6 gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setStaffTab("bureau_desk")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            staffTab === "bureau_desk"
              ? "bg-brand-teal text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-50 border border-brand-border"
          }`}
        >
          <Building2 className="h-4 w-4" />
          Guichet Caisse Bureau
        </button>

        <button
          onClick={() => setStaffTab("wires")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            staffTab === "wires"
              ? "bg-brand-teal text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-50 border border-brand-border"
          }`}
        >
          <CreditCard className="h-4 w-4" />
          Virements Internationaux
        </button>

        <button
          onClick={() => setStaffTab("disputes")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            staffTab === "disputes"
              ? "bg-brand-teal text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-50 border border-brand-border"
          }`}
        >
          <AlertTriangle className="h-4 w-4" />
          Litiges & Sécurité
        </button>

        <button
          onClick={() => setStaffTab("accounts")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            staffTab === "accounts"
              ? "bg-brand-teal text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-50 border border-brand-border"
          }`}
        >
          <Users className="h-4 w-4" />
          Création Comptes Staff
        </button>

        <button
          onClick={() => setStaffTab("ledger")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            staffTab === "ledger"
              ? "bg-brand-teal text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-50 border border-brand-border"
          }`}
        >
          <FileText className="h-4 w-4" />
          Grand Livre & Audit Trail
        </button>
      </div>

      {/* DESK 1: GUICHET BUREAU CASHIER */}
      {staffTab === "bureau_desk" && tx && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-brand-border shadow-xs">
            <h2 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-brand-accent" />
              Encaissement Espèces & Vérification Client
            </h2>

            {/* Lookup Input */}
            <div className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearchDossier()}
                  placeholder="Code de paiement bordereau (ex: CP-748921)..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:border-brand-accent outline-none"
                />
              </div>
              <button
                onClick={() => handleSearchDossier()}
                className="px-4 py-2.5 bg-brand-teal text-white rounded-xl text-xs font-bold hover:bg-brand-teal-800 transition shadow-xs flex items-center gap-1.5"
              >
                <Search className="h-3.5 w-3.5" />
                <span>Rechercher</span>
              </button>
            </div>

            {/* Quick picker for pending bureau deposits */}
            <div className="mb-6 p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-2 tracking-wider">
                Dossiers en attente au guichet ({allTransactions.filter((t) => t.status === "AWAITING_PAYMENT").length}) :
              </span>
              <div className="flex flex-wrap gap-1.5">
                {allTransactions
                  .filter((t) => t.status === "AWAITING_PAYMENT")
                  .map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleSearchDossier(t.paymentCode)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                        tx.id === t.id
                          ? "bg-brand-teal text-white border-brand-teal shadow-xs"
                          : "bg-white text-slate-700 border-slate-200 hover:border-brand-teal"
                      }`}
                    >
                      <span className="font-mono">{t.paymentCode}</span> ({t.priceBreakdown.totalDzd.toLocaleString()} DZD)
                    </button>
                  ))}
                {allTransactions.filter((t) => t.status === "AWAITING_PAYMENT").length === 0 && (
                  <span className="text-xs text-slate-400 italic">Aucun dossier en attente au guichet.</span>
                )}
              </div>
            </div>

            {/* Dossier details */}
            <div className="bg-brand-bg rounded-2xl p-5 border border-brand-border mb-6">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase">Dossier Transaction #{tx.paymentCode}</span>
                <span className="text-xs font-mono font-black px-2.5 py-1 rounded-full bg-brand-teal text-white">
                  Statut: {tx.status}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs mb-4">
                <div>
                  <span className="text-slate-400 block text-[11px]">Produit Requis</span>
                  <strong className="text-slate-800 text-sm">{tx.productName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Acheteur Déposant</span>
                  <strong className="text-slate-800 text-sm">{tx.buyerName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Voyageur Attribué</span>
                  <strong className="text-brand-accent text-sm">{tx.bringerName}</strong>
                </div>
              </div>

              {/* Locked Financials */}
              <div className="p-4 bg-white rounded-xl border border-brand-border grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Prix Achat Étranger</span>
                  <span className="font-bold text-slate-800">€{tx.priceBreakdown.productPrice}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Prime Voyageur</span>
                  <span className="font-bold text-brand-accent">€{tx.priceBreakdown.bringerFee}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Frais Caba & Garantie</span>
                  <span className="font-bold text-slate-800">€{(tx.priceBreakdown.platformFee + tx.priceBreakdown.guaranteeFee).toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Total Exigible au Guichet</span>
                  <span className="font-extrabold text-brand-accent text-sm">{tx.priceBreakdown.totalDzd.toLocaleString()} DZD</span>
                </div>
              </div>
            </div>

            {/* Payment processing form */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Montant Espèces Reçu au Guichet (DZD)
                </label>
                <input
                  type="number"
                  value={receivedAmount}
                  onChange={(e) => setReceivedAmount(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold focus:border-brand-accent outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="idCheck"
                  checked={idChecked}
                  onChange={(e) => setIdChecked(e.target.checked)}
                  className="h-4 w-4 rounded text-brand-accent focus:ring-brand-accent"
                />
                <label htmlFor="idCheck" className="text-xs font-semibold text-slate-700">
                  Pièce d'identité originale de l'acheteur vérifiée physiquement (CNI / Passeport)
                </label>
              </div>

              <button
                onClick={handleConfirmCashPayment}
                disabled={tx.status !== "AWAITING_PAYMENT"}
                className={`w-full py-3.5 rounded-2xl text-xs font-extrabold shadow-sm transition flex items-center justify-center gap-2 ${
                  tx.status === "AWAITING_PAYMENT"
                    ? "bg-brand-teal hover:bg-brand-teal-800 text-white shadow-brand-teal/20"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                }`}
              >
                <Check className="h-4 w-4" />
                <span>Valider le Reçu & Enregistrer l'Encaissement</span>
              </button>
            </div>
          </div>

          {/* Bureau Information & Status */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-brand-border shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-brand-accent" />
                Bureau d'Affectation
              </h3>
              <p className="text-xs font-bold text-slate-800">{tx.bureauName}</p>
              <p className="text-xs text-slate-500 mt-1">{tx.bureauAddress}</p>
              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between text-xs">
                <span className="text-slate-400">Heures d'ouverture:</span>
                <span className="font-semibold text-slate-700">08:30 - 18:00</span>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-brand-border shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Lock className="h-4 w-4 text-emerald-600" />
                Code de Livraison Haché
              </h3>
              <p className="text-xs text-slate-600 mb-2">
                Le code 6 chiffres est généré et stocké chiffré (<code className="text-[11px] font-mono">SHA-256</code>).
              </p>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono text-center text-xs break-all text-slate-500">
                {tx.deliveryCode.hashedCode}
              </div>
              {tx.deliveryCode.plaintextForDemo && (
                <div className="mt-3 p-3 bg-brand-teal-50 rounded-xl border border-brand-accent/20 text-center">
                  <span className="text-[10px] font-bold text-brand-accent uppercase block">Clé Démo Utilisateur</span>
                  <span className="font-mono text-xl font-black text-brand-accent">{tx.deliveryCode.plaintextForDemo}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DESK 2: INTERNATIONAL WIRES & DUAL CONTROL */}
      {staffTab === "wires" && tx && (
        <div className="bg-white rounded-3xl p-6 border border-brand-border shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-brand-accent" />
                Gestion des Virements Internationaux vers les Voyageurs
              </h2>
              <p className="text-xs text-slate-500">
                Envoi de l'avance (prix d'achat) à l'étranger. Les montants &gt; 500 € nécessitent une double validation Finance.
              </p>
            </div>
          </div>

          {/* Quick dossier selector for wires */}
          <div className="mb-6 p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-2 tracking-wider">
              Dossiers avec paiement consigné ({allTransactions.filter((t) => t.status === "PAID" || t.status === "FUNDS_TRANSFER_PENDING").length}) :
            </span>
            <div className="flex flex-wrap gap-1.5">
              {allTransactions
                .filter((t) => t.status === "PAID" || t.status === "FUNDS_TRANSFER_PENDING")
                .map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleSearchDossier(t.paymentCode)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                      tx.id === t.id
                        ? "bg-brand-teal text-white border-brand-teal shadow-xs"
                        : "bg-white text-slate-700 border-slate-200 hover:border-brand-teal"
                    }`}
                  >
                    <span className="font-mono">{t.paymentCode}</span> ({t.bringerName} - €{t.priceBreakdown.productPrice})
                  </button>
                ))}
              {allTransactions.filter((t) => t.status === "PAID" || t.status === "FUNDS_TRANSFER_PENDING").length === 0 && (
                <span className="text-xs text-slate-400 italic">Aucun virement en attente d&apos;émission.</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Initiate wire form */}
            <div className="p-5 bg-brand-bg rounded-2xl border border-brand-border">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide mb-3">
                1. Émettre le Virement International (Avance Achat)
              </h3>
              <div className="space-y-3 text-xs mb-4">
                <div className="flex justify-between">
                  <span className="text-slate-500">Bénéficiaire Voyageur:</span>
                  <span className="font-bold text-slate-900">{tx.bringerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Montant de l'avance produit:</span>
                  <span className="font-black text-brand-accent text-sm">€{tx.priceBreakdown.productPrice}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Méthode de virement:</span>
                  <span className="font-bold text-slate-800">SEPA Bank Wire / Wise Card</span>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Référence Virement Bancaire (SWIFT / SEPA)
                </label>
                <input
                  type="text"
                  value={wireRef}
                  onChange={(e) => setWireRef(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold outline-none"
                />
              </div>

              <button
                onClick={handleDispatchWire}
                disabled={tx.status !== "PAID"}
                className={`w-full py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                  tx.status === "PAID"
                    ? "bg-brand-teal text-white hover:bg-brand-teal-800 shadow-sm"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                }`}
              >
                <Send className="h-4 w-4" />
                <span>Enregistrer Ordre de Virement</span>
              </button>
            </div>

            {/* Dual Control Approval card */}
            <div className="p-5 bg-amber-50/50 rounded-2xl border border-amber-200">
              <div className="flex items-center gap-2 text-amber-900 mb-2">
                <ShieldCheck className="h-5 w-5 text-amber-600" />
                <h3 className="text-xs font-extrabold uppercase tracking-wide">
                  2. Double Contrôle Finance (&gt; 500 €)
                </h3>
              </div>
              <p className="text-xs text-amber-800 mb-4 leading-relaxed">
                Règle de sécurité: tout virement d'un montant élevé requiert l'autorisation formelle d'un administrateur financier distinct.
              </p>

              <div className="p-3 bg-white rounded-xl border border-amber-200 text-xs space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-slate-500">Statut Virement:</span>
                  <span className="font-bold text-amber-700">{tx.fundsTransfer?.status || "Non initié"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Double validation requise:</span>
                  <span className="font-bold">{tx.fundsTransfer?.requiresDualApproval ? "OUI" : "NON (Inférieur au seuil)"}</span>
                </div>
                {tx.fundsTransfer?.approvedBy && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Approuvé par:</span>
                    <span className="font-bold text-emerald-700">{tx.fundsTransfer.approvedBy}</span>
                  </div>
                )}
              </div>

              <button
                onClick={handleApproveDualControl}
                disabled={tx.status !== "FUNDS_TRANSFER_PENDING"}
                className={`w-full py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                  tx.status === "FUNDS_TRANSFER_PENDING"
                    ? "bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                }`}
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Signer & Autoriser le Déblocage (Finance)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DESK 3: DISPUTES & RESOLUTION */}
      {staffTab === "disputes" && tx && (
        <div className="bg-white rounded-3xl p-6 border border-brand-border shadow-xs">
          <h2 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Bureau des Litiges & Arbitrage Caba Pro
          </h2>

          {/* Quick dossier selector for disputes */}
          <div className="mb-6 p-3 bg-red-50/60 rounded-2xl border border-red-200">
            <span className="text-[10px] font-extrabold uppercase text-red-500 block mb-2 tracking-wider">
              Dossiers actuellement en litige ({allTransactions.filter((t) => t.status === "DISPUTED").length}) :
            </span>
            <div className="flex flex-wrap gap-1.5">
              {allTransactions
                .filter((t) => t.status === "DISPUTED")
                .map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleSearchDossier(t.paymentCode)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                      tx.id === t.id
                        ? "bg-red-600 text-white border-red-600 shadow-xs"
                        : "bg-white text-slate-700 border-red-200 hover:border-red-400"
                    }`}
                  >
                    <span className="font-mono">{t.paymentCode}</span> ({t.dispute?.reason || "Litige ouvert"})
                  </button>
                ))}
              {allTransactions.filter((t) => t.status === "DISPUTED").length === 0 && (
                <span className="text-xs text-slate-500 italic">Aucun litige en cours d&apos;arbitrage.</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-5 bg-brand-bg rounded-2xl border border-brand-border">
              <h3 className="text-xs font-bold uppercase tracking-wide text-slate-700 mb-3">
                Dossier du Litige
              </h3>
              {tx.dispute ? (
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-red-50 border border-red-200 text-red-900 rounded-xl">
                    <span className="font-bold block mb-1">Motif invoqué par {tx.dispute.openedByName}:</span>
                    <p>{tx.dispute.reason}</p>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Statut du litige:</span>
                    <span className="font-bold text-slate-800">{tx.dispute.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Date d&apos;ouverture:</span>
                    <span className="font-bold text-slate-800">{new Date(tx.dispute.openedAt).toLocaleString()}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-xs text-slate-600 font-semibold">Aucun litige actif sur cette transaction.</p>
                  <p className="text-[11px] text-slate-400 mt-1">Les fonds sous séquestre suivent le cycle normal de livraison.</p>
                </div>
              )}
            </div>

            {/* Verdict controls */}
            <div className="p-5 bg-white rounded-2xl border border-brand-border">
              <h3 className="text-xs font-bold uppercase tracking-wide text-slate-700 mb-3">
                Rendre le Verdict (Modérateur)
              </h3>
              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Décision d'Arbitrage</label>
                  <select
                    value={disputeVerdict}
                    onChange={(e: any) => setDisputeVerdict(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold outline-none"
                  >
                    <option value="PARTIAL_REFUND">Remboursement Partiel (Split / Accord Amiable)</option>
                    <option value="FULL_REFUND">Remboursement Intégral Acheteur (Article Non-Conforme)</option>
                    <option value="RELEASE_BRINGER">Rejet du Litige & Paiement Voyageur (Conforme)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Motivations du Verdict</label>
                  <textarea
                    rows={3}
                    value={verdictNotes}
                    onChange={(e) => setVerdictNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none"
                  />
                </div>
              </div>

              <button
                onClick={handleResolveDispute}
                disabled={tx.status !== "DISPUTED"}
                className={`w-full py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                  tx.status === "DISPUTED"
                    ? "bg-slate-900 text-white hover:bg-slate-800 shadow-sm"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                }`}
              >
                <Check className="h-4 w-4" />
                <span>Appliquer le Verdict et Exécuter le Grand Livre</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DESK 4: STAFF ACCOUNT CREATION (ADMIN ONLY) */}
      {staffTab === "accounts" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Creation Form */}
          <div className="lg:col-span-1 bg-white rounded-3xl p-6 border border-brand-border shadow-xs">
            <h2 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
              <Plus className="h-5 w-5 text-brand-accent" />
              Créer un Compte Staff
            </h2>

            <form onSubmit={handleCreateStaff} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nom Complet</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Yacine Benali"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Adresse Email Professionnelle</label>
                <input
                  type="email"
                  required
                  placeholder="yacine.bureau@cabapro.dz"
                  value={newStaffEmail}
                  onChange={(e) => setNewStaffEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Rôle Attribué</label>
                <select
                  value={newStaffRole}
                  onChange={(e: any) => setNewStaffRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none font-semibold"
                >
                  <option value="bureau_staff">Agent de Bureau (Guichet)</option>
                  <option value="finance">Responsable Finance (Virements & Double Contrôle)</option>
                  <option value="moderator">Modérateur (Gestion des Litiges)</option>
                  <option value="admin">Administrateur Système</option>
                </select>
              </div>

              {newStaffRole === "bureau_staff" && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bureau d'Affectation</label>
                  <select
                    value={newStaffBureau}
                    onChange={(e) => setNewStaffBureau(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none"
                  >
                    {PARTNER_BUREAUS.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.city})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Code PIN d'Accès Rapide</label>
                <input
                  type="text"
                  maxLength={4}
                  value={newStaffPin}
                  onChange={(e) => setNewStaffPin(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-brand-teal hover:bg-brand-teal-800 text-white rounded-xl font-bold transition shadow-sm"
              >
                Créer le Compte Staff
              </button>
            </form>
          </div>

          {/* Active staff accounts list */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-brand-border shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Users className="h-5 w-5 text-brand-accent" />
                Comptes Personnels Actifs ({createdStaffList.length})
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-2.5">Membre</th>
                    <th className="py-2.5">Rôle</th>
                    <th className="py-2.5">Affectation</th>
                    <th className="py-2.5">PIN</th>
                    <th className="py-2.5">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {createdStaffList.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 font-bold text-slate-800">
                        {st.name}
                        <span className="block text-[11px] font-normal text-slate-500">{st.email}</span>
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-brand-teal-50 text-brand-accent">
                          {st.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 text-slate-600 font-medium">
                        {st.bureauName || "Siège National"}
                      </td>
                      <td className="py-3 font-mono font-bold text-slate-700">{st.pin}</td>
                      <td className="py-3 text-slate-400">{st.createdAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* DESK 5: MASTER LEDGER & AUDIT TRAIL */}
      {staffTab === "ledger" && (
        <div className="space-y-6">
          {/* Double-entry Ledger Table */}
          <div className="bg-white rounded-3xl p-6 border border-brand-border shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-brand-accent" />
                Grand Livre Comptable Immuable (Double-Entry Ledger)
              </h2>
              <span className="text-xs font-semibold text-slate-500">
                {ledgerEntries.length} écriture(s) enregistrée(s)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-2.5">Timestamp</th>
                    <th className="py-2.5">Compte Débit</th>
                    <th className="py-2.5">Compte Crédit</th>
                    <th className="py-2.5">Montant</th>
                    <th className="py-2.5">Devise</th>
                    <th className="py-2.5">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {ledgerEntries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400 font-sans">
                        Aucune écriture comptable pour l'instant.
                      </td>
                    </tr>
                  ) : (
                    ledgerEntries.map((l) => (
                      <tr key={l.id} className="hover:bg-slate-50">
                        <td className="py-2.5 text-slate-400">{new Date(l.timestamp).toLocaleTimeString()}</td>
                        <td className="py-2.5 font-bold text-emerald-700">{l.debitAccount}</td>
                        <td className="py-2.5 font-bold text-brand-accent">{l.creditAccount}</td>
                        <td className="py-2.5 font-extrabold text-slate-900">{l.amount.toLocaleString()}</td>
                        <td className="py-2.5 font-bold">{l.currency}</td>
                        <td className="py-2.5 font-sans text-slate-600 truncate max-w-xs">{l.description}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="bg-white rounded-3xl p-6 border border-brand-border shadow-xs">
            <h2 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-brand-accent" />
              Journal d'Audit & Traçabilité (Audit Trail)
            </h2>

            <div className="space-y-3 font-sans text-xs">
              {auditLogs.map((a) => (
                <div key={a.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-extrabold text-slate-900">{a.action}</span>
                      <span className="text-[10px] bg-white border px-2 py-0.5 rounded-full text-slate-500 font-mono">
                        {a.fromState} → {a.toState}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px]">{a.details}</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Par: <strong>{a.actorName}</strong> ({a.actorRole}) • {new Date(a.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
