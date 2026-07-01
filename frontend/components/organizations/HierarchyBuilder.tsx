"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Edit2,
  Plus,
  Trash2,
  GripVertical,
  Check,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { OrgUnit, UnitType } from "@/types/organization";

interface LocalUnit {
  id: string;
  parent_id: string | null;
  name: string;
  unit_type: UnitType;
  sort_order: number;
  competency_codes: string[];
  children: LocalUnit[];
}

interface Props {
  units: LocalUnit[];
  onChange: (units: LocalUnit[]) => void;
}

let idSeq = 0;
function newId() { return `new-${++idSeq}`; }

function newUnit(parent_id: string | null, sort_order: number): LocalUnit {
  return { id: newId(), parent_id, name: "New Team", unit_type: "TEAM", sort_order, competency_codes: [], children: [] };
}

const TYPE_OPTIONS: { value: UnitType; label: string }[] = [
  { value: "BUSINESS_UNIT", label: "Business Unit" },
  { value: "DEPARTMENT", label: "Department" },
  { value: "TEAM", label: "Team" },
];

function UnitRow({
  unit,
  depth,
  onAdd,
  onRename,
  onTypeChange,
  onDelete,
}: {
  unit: LocalUnit;
  depth: number;
  onAdd: (parentId: string) => void;
  onRename: (id: string, name: string) => void;
  onTypeChange: (id: string, type: UnitType) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(unit.name);

  const hasChildren = unit.children.length > 0;

  function commitRename() {
    if (draft.trim()) onRename(unit.id, draft.trim());
    else setDraft(unit.name);
    setEditing(false);
  }

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-1 py-1.5 px-2 rounded-md hover:bg-grey-50 group transition-colors",
        )}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
      >
        {/* Expand toggle */}
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className={cn(
            "h-5 w-5 shrink-0 flex items-center justify-center rounded text-grey-400 hover:text-grey-700",
            !hasChildren && "invisible",
          )}
        >
          {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </button>

        {/* Drag handle (visual only) */}
        <GripVertical className="h-4 w-4 text-grey-200 shrink-0" />

        {/* Name */}
        {editing ? (
          <div className="flex items-center gap-1 flex-1 min-w-0">
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") { setDraft(unit.name); setEditing(false); } }}
              className="flex-1 min-w-0 px-2 py-0.5 text-sm border border-velvet rounded focus:outline-none focus:ring-1 focus:ring-velvet"
            />
            <button type="button" onClick={commitRename} className="p-1 text-green-600 hover:text-green-700">
              <Check className="h-3.5 w-3.5" />
            </button>
            <button type="button" onClick={() => { setDraft(unit.name); setEditing(false); }} className="p-1 text-grey-400 hover:text-grey-600">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <span
            className="flex-1 min-w-0 text-sm text-grey-800 truncate cursor-pointer"
            onDoubleClick={() => { setDraft(unit.name); setEditing(true); }}
          >
            {unit.name}
          </span>
        )}

        {/* Type selector */}
        <select
          value={unit.unit_type}
          onChange={(e) => onTypeChange(unit.id, e.target.value as UnitType)}
          className="text-xs text-grey-500 border border-grey-200 rounded px-1.5 py-0.5 focus:outline-none focus:border-velvet shrink-0"
        >
          {TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {/* Actions (shown on hover) */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            type="button"
            onClick={() => { setDraft(unit.name); setEditing(true); }}
            className="p-1 rounded text-grey-400 hover:text-grey-700 hover:bg-grey-100"
            title="Rename"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onAdd(unit.id)}
            className="p-1 rounded text-grey-400 hover:text-velvet hover:bg-velvet/10"
            title="Add child"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(unit.id)}
            className="p-1 rounded text-grey-400 hover:text-red-600 hover:bg-red-50"
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Children */}
      {expanded && hasChildren && (
        <div>
          {unit.children.map((child) => (
            <UnitRow
              key={child.id}
              unit={child}
              depth={depth + 1}
              onAdd={onAdd}
              onRename={onRename}
              onTypeChange={onTypeChange}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function addToTree(units: LocalUnit[], parentId: string, newUnit: LocalUnit): LocalUnit[] {
  return units.map((u) => {
    if (u.id === parentId) return { ...u, children: [...u.children, newUnit] };
    return { ...u, children: addToTree(u.children, parentId, newUnit) };
  });
}

function renameInTree(units: LocalUnit[], id: string, name: string): LocalUnit[] {
  return units.map((u) => {
    if (u.id === id) return { ...u, name };
    return { ...u, children: renameInTree(u.children, id, name) };
  });
}

function typeInTree(units: LocalUnit[], id: string, type: UnitType): LocalUnit[] {
  return units.map((u) => {
    if (u.id === id) return { ...u, unit_type: type };
    return { ...u, children: typeInTree(u.children, id, type) };
  });
}

function deleteFromTree(units: LocalUnit[], id: string): LocalUnit[] {
  return units.filter((u) => u.id !== id).map((u) => ({ ...u, children: deleteFromTree(u.children, id) }));
}

export type { LocalUnit };

export function HierarchyBuilder({ units, onChange }: Props) {
  function handleAdd(parentId: string | null) {
    const sibs = parentId
      ? (function find(list: LocalUnit[]): LocalUnit[] {
          for (const u of list) { if (u.id === parentId) return u.children; const r = find(u.children); if (r.length > -1 && u.id !== parentId) continue; return r; }
          return [];
        })(units)
      : units;
    const unit = newUnit(parentId, sibs.length);
    if (parentId === null) {
      onChange([...units, unit]);
    } else {
      onChange(addToTree(units, parentId, unit));
    }
  }

  return (
    <div className="border border-grey-200 rounded-lg overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-grey-100 bg-grey-50">
        <p className="text-xs font-medium text-grey-500 uppercase tracking-wide">Hierarchy</p>
        <button
          type="button"
          onClick={() => handleAdd(null)}
          className="flex items-center gap-1.5 text-xs font-medium text-velvet hover:text-velvet/80 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Add root unit
        </button>
      </div>

      {/* Tree */}
      <div className="py-2 min-h-[120px]">
        {units.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2 text-grey-400">
            <p className="text-sm">No units yet</p>
            <button
              type="button"
              onClick={() => handleAdd(null)}
              className="text-xs text-velvet hover:underline"
            >
              Add your first unit
            </button>
          </div>
        ) : (
          units.map((u) => (
            <UnitRow
              key={u.id}
              unit={u}
              depth={0}
              onAdd={handleAdd}
              onRename={(id, name) => onChange(renameInTree(units, id, name))}
              onTypeChange={(id, type) => onChange(typeInTree(units, id, type))}
              onDelete={(id) => onChange(deleteFromTree(units, id))}
            />
          ))
        )}
      </div>

      <p className="px-4 py-2 text-xs text-grey-400 border-t border-grey-100">
        Double-click a name to rename · Click + to add a child unit
      </p>
    </div>
  );
}
