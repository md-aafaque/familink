"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import { X, Loader2, Link2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "../lib/cn";
import { useAppTheme } from "./providers/ThemeProvider";

interface RelationshipProposalModalProps {
  treeId: string;
  sourceId?: string;
  targetId?: string;
  onClose: () => void;
  initialFromId?: string;
  initialToId?: string;
}

const RELATIONSHIP_TYPES = [
  { value: "parent",  label: "Parent"  },
  { value: "child",   label: "Child"   },
  { value: "spouse",  label: "Spouse"  },
  { value: "sibling", label: "Sibling" },
] as const;

type RelType = (typeof RELATIONSHIP_TYPES)[number]["value"];

export default function RelationshipProposalModal({
  treeId,
  sourceId,
  targetId,
  onClose,
  initialFromId,
  initialToId,
}: RelationshipProposalModalProps) {
  // sourceId takes priority over initialFromId for pre-population
  const [fromId, setFromId] = useState(sourceId ?? initialFromId ?? "");
  const [toId,   setToId  ] = useState(targetId ?? initialToId ?? "");
  const [type,   setType  ] = useState<RelType>("parent");

  const queryClient = useQueryClient();
  const { theme } = useAppTheme();

  // ── Data ──────────────────────────────────────────────────────────────
  const { data: people = [] } = useQuery<{ id: string; firstName: string; lastName?: string }[]>({
    queryKey: ["people", treeId],
    queryFn: () => api.get(`/trees/${treeId}/people`).then((res) => res.data),
  });

  const proposalMutation = useMutation({
    mutationFn: (payload: { fromPersonId: string; toPersonId: string; relationshipType: RelType }) =>
      api.post(`/trees/${treeId}/relationship-proposals`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["relationships", treeId] });
      onClose();
    },
  });

  // ── Helpers ───────────────────────────────────────────────────────────
  const fromPerson = people.find((p) => p.id === fromId);
  const toPerson   = people.find((p) => p.id === toId);
  const canSubmit  = !proposalMutation.isPending && fromId && toId && fromId !== toId;

  const errorMessage = proposalMutation.isError
    ? ((proposalMutation.error as Error)?.message ?? "Something went wrong. Please try again.")
    : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    proposalMutation.mutate({ fromPersonId: fromId, toPersonId: toId, relationshipType: type });
  };

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 24 }}
        animate={{ opacity: 1, scale: 1,    y: 0  }}
        exit={{   opacity: 0, scale: 0.93, y: 24  }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className={cn(
          "relative w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden transition-colors duration-500",
          theme.colors.surface
        )}
      >
        {/* ── Header ── */}
        <div className={cn("px-8 py-6 border-b flex items-center justify-between", theme.colors.border)}>
          <div className="flex items-center gap-4">
            <div className={cn("w-11 h-11 rounded-2xl flex items-center justify-center", theme.colors.primaryMuted)}>
              <Link2 className={cn("w-5 h-5", theme.colors.accent)} />
            </div>
            <div>
              <h2 className={cn("text-xl font-black leading-tight", theme.colors.text)}>
                Propose Relationship
              </h2>
              <p className={cn("text-xs font-medium mt-0.5", theme.colors.textMuted)}>
                Link two family members together
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            className={cn(
              "p-2.5 rounded-xl transition-all hover:bg-black/5 dark:hover:bg-white/5",
              theme.colors.textMuted
            )}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Body ── */}
        <form onSubmit={handleSubmit} className="px-8 py-7 space-y-6">

          {/* Error banner */}
          {errorMessage && (
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-2xl">
              <span className="mt-0.5 w-4 h-4 rounded-full bg-red-500 flex-shrink-0" />
              <p className="text-sm font-semibold text-red-700 dark:text-red-400 leading-snug">
                {errorMessage}
              </p>
            </div>
          )}

          {/* FROM person */}
          <Field label="Subject Person">
            <PersonSelect
              value={fromId}
              onChange={setFromId}
              people={people}
              excludeId={toId}
              placeholder="Select person…"
              theme={theme}
            />
          </Field>

          {/* Relationship type */}
          <Field label="Is the…">
            <div className="grid grid-cols-4 gap-2">
              {RELATIONSHIP_TYPES.map((rt) => (
                <button
                  key={rt.value}
                  type="button"
                  onClick={() => setType(rt.value)}
                  className={cn(
                    "py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all border",
                    type === rt.value
                      ? cn(theme.colors.primary, "text-white border-transparent shadow-md")
                      : cn(theme.colors.bg, theme.colors.border, theme.colors.textMuted, "hover:border-primary/40")
                  )}
                >
                  {rt.label}
                </button>
              ))}
            </div>
          </Field>

          {/* TO person */}
          <Field label="Of…">
            <PersonSelect
              value={toId}
              onChange={setToId}
              people={people}
              excludeId={fromId}
              placeholder="Select person…"
              theme={theme}
            />
          </Field>

          {/* Relationship preview */}
          {fromPerson && toPerson && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex items-center gap-3 px-5 py-3.5 rounded-2xl border text-sm font-semibold",
                theme.colors.primaryMuted,
                theme.colors.border
              )}
            >
              <span className={theme.colors.text}>
                {fromPerson.firstName} {fromPerson.lastName ?? ""}
              </span>
              <ArrowRight className={cn("w-4 h-4 flex-shrink-0", theme.colors.accent)} />
              <span className={cn("text-xs uppercase tracking-widest font-black", theme.colors.accent)}>
                {type}
              </span>
              <ArrowRight className={cn("w-4 h-4 flex-shrink-0", theme.colors.accent)} />
              <span className={theme.colors.text}>
                {toPerson.firstName} {toPerson.lastName ?? ""}
              </span>
            </motion.div>
          )}

          {/* Self-selection warning */}
          {fromId && toId && fromId === toId && (
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 text-center">
              A person cannot have a relationship with themselves.
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit}
            className={cn(
              "w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2.5 transition-all",
              "text-white shadow-lg hover:opacity-90 active:scale-[0.98]",
              "disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100",
              theme.colors.primary
            )}
          >
            {proposalMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Submit Proposal
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
        {label}
      </label>
      {children}
    </div>
  );
}

interface PersonSelectProps {
  value: string;
  onChange: (id: string) => void;
  people: { id: string; firstName: string; lastName?: string }[];
  excludeId: string;
  placeholder: string;
  theme: any;
}

function PersonSelect({ value, onChange, people, excludeId, placeholder, theme }: PersonSelectProps) {
  return (
    <select
      required
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "w-full px-5 py-3.5 rounded-2xl border outline-none appearance-none font-semibold text-sm transition-all",
        "focus:ring-4 focus:ring-primary/10 focus:border-primary/50",
        theme.colors.bg,
        theme.colors.border,
        theme.colors.text
      )}
    >
      <option value="">{placeholder}</option>
      {people
        .filter((p) => p.id !== excludeId)
        .map((p) => (
          <option key={p.id} value={p.id}>
            {p.firstName} {p.lastName ?? ""}
          </option>
        ))}
    </select>
  );
}