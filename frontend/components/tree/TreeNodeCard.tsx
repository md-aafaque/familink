"use client";

import { cn } from "@/lib/cn";
import { useTreeInteraction } from "./TreeInteractionProvider";

interface TreeNodeCardProps {
  person: Person;
  accentHex: string;
  isFocus: boolean;
  isHit: boolean;
  onFocus: (id: string) => void;
  onDrop: (srcId: string, tgtId: string) => void;
}

interface Person {
  id: string;
  firstName: string;
  lastName?: string;
  nickname?: string;
  status?: string;
  birthDate?: string;
  deathDate?: string;
  imageUrl?: string;
  relationships: Array<{ type: string; targetId: string }>;
}

/* Role‑based accent colours matching the spec */
const ROLE_COLORS = {
  root:    "#F97316",
  spouse:  "#F472B6",
  child:   "#60A5FA",
  parent:  "#34D399",
  extended:"#A78BFA",
  unknown: "#64748B",
} as const;

export function getNodeAccent(person: Person): string {
  const relTypes = person.relationships.map(r => r.type);
  if (relTypes.length === 0) return ROLE_COLORS.root;
  if (relTypes.includes("spouse")) return ROLE_COLORS.spouse;
  if (relTypes.includes("parent")) return ROLE_COLORS.parent;
  if (relTypes.includes("child"))  return ROLE_COLORS.child;
  if (relTypes.includes("sibling")) return ROLE_COLORS.extended;
  return ROLE_COLORS.unknown;
}

const CARD_W = 260;
const CARD_H = 100;

/* Hard‑shadow shortcut — stronger for larger card */
const HARD_SHADOW = "5px 5px 0px #1E293B";
const HOVER_SHADOW = "8px 8px 0px #1E293B";
const SPRING = "300ms cubic-bezier(0.34,1.56,0.64,1)";

export default function TreeNodeCard({
  person, accentHex, isFocus, isHit,
  onFocus, onDrop,
}: TreeNodeCardProps) {
  const { setHoveredPersonId } = useTreeInteraction();
  const initials  = `${person.firstName[0]}${person.lastName?.[0] ?? ""}`.toUpperCase();
  const isDead    = !!person.deathDate || person.status?.toLowerCase().includes("deceas");
  const birthYr   = person.birthDate?.match(/\d{4}/)?.[0];
  const deathYr   = person.deathDate?.match(/\d{4}/)?.[0];
  const dateLabel = [birthYr && `b.${birthYr}`, deathYr && `d.${deathYr}`].filter(Boolean).join(" ");

  const relTypes = person.relationships.map(r => r.type);
  const roleLabel = relTypes.includes("spouse") ? "Partner"
    : relTypes.includes("parent") ? "Parent"
    : relTypes.includes("child") ? "Child"
    : relTypes.includes("sibling") ? "Sibling"
    : null;

  const onDragStart  = (e: React.DragEvent) => { e.dataTransfer.setData("text/personId", person.id); e.dataTransfer.effectAllowed = "link"; };
  const onDragOver   = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = "link"; };
  const onDropHandle = (e: React.DragEvent) => { e.preventDefault(); const src = e.dataTransfer.getData("text/personId"); if (src && src !== person.id) onDrop(src, person.id); };

  const isGhost  = person.status === 'ghost';
  const isActive = person.status === 'active';

  return (
    <div className="relative group" style={{ width: CARD_W }}>
      <button
        draggable
        onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDropHandle}
        onClick={() => onFocus(person.id)}
        style={{
          width: CARD_W, height: CARD_H,
          borderColor: isFocus ? accentHex : "#1E293B",
          boxShadow: isFocus
            ? `0 0 0 4px ${accentHex}33, ${HARD_SHADOW}`
            : HARD_SHADOW,
          transition: `all ${SPRING}`,
          transform: isFocus ? "scale(1.03)" : undefined,
          borderRadius: 20,
        }}
        className={cn(
          "relative flex items-center overflow-hidden text-left cursor-pointer",
          "border-2 transition-all",
          "hover:-translate-y-1 hover:scale-[1.02]",
          "bg-card",
        )}
        onMouseEnter={(e) => {
          setHoveredPersonId(person.id);
          if (!isFocus) {
            e.currentTarget.style.boxShadow = HOVER_SHADOW;
          }
        }}
        onMouseLeave={(e) => {
          setHoveredPersonId(null);
          if (!isFocus) {
            e.currentTarget.style.boxShadow = HARD_SHADOW;
          }
        }}
      >
        {/* Focus gradient overlay */}
        {isFocus && (
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: `linear-gradient(135deg, ${accentHex}18, transparent 60%)` }} />
        )}

        {/* Status dot — corner */}
        <div className="absolute top-1.5 right-1.5 z-10">
          {isDead ? (
            <div className="w-2.5 h-2.5 rounded-full bg-slate-400 border-2 border-card" title="Deceased" />
          ) : isGhost ? (
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 border-2 border-card" title="Pending" />
          ) : isActive ? (
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-card" title="Linked" />
          ) : (
            <div className="w-2.5 h-2.5 rounded-full bg-slate-300 border-2 border-card" />
          )}
        </div>

        <div className="flex items-center w-full pl-4 pr-4 gap-4">
          {/* Avatar — 52px circle */}
          <div className="relative flex-shrink-0">
            <div
              className="flex items-center justify-center text-lg font-black text-white overflow-hidden transition-all duration-300 group-hover:scale-110 group-hover:-rotate-3"
              style={{ width: 52, height: 52, borderRadius: "50%", backgroundColor: accentHex }}
            >
              {person.imageUrl ? (
                <img src={person.imageUrl} alt="" className="w-full h-full object-cover" />
              ) : initials}
            </div>
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0 py-2">
            <div className="flex items-center gap-1.5 mb-1">
              <h4 className={cn(
                "text-[15px] font-bold tracking-tight leading-none truncate",
                "text-foreground",
                isDead && "opacity-60"
              )}>
                {person.firstName} {person.lastName}
              </h4>
              {isDead && (
                <span className="text-[8px] uppercase font-black px-2 py-0.5 rounded-full bg-muted-foreground/20 text-muted-foreground leading-none flex-shrink-0">
                  RIP
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {roleLabel && (
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                  style={{ backgroundColor: `${accentHex}18`, color: accentHex }}>
                  {roleLabel}
                </span>
              )}
              {dateLabel && (
                <span className={cn(
                  "text-[9px] tabular-nums font-bold tracking-wider uppercase",
                  "text-muted-foreground",
                  isDead && "opacity-50"
                )}>
                  {dateLabel}
                </span>
              )}
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}
