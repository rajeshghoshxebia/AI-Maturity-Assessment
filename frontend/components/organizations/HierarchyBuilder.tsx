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
  SlidersHorizontal,
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
  active_dimension_codes: string[] | null;
  children: LocalUnit[];
}

interface DimensionOption {
  code: string;
  name: string;
}

interface Props {
  units: LocalUnit[];
  onChange: (units: LocalUnit[]) => void;
  dimensions?: DimensionOption[];
}

let idSeq = 0;
function newId() { return `new-${++idSeq}`; }

function newUnit(parent_id: string | null, sort_order: number): LocalUnit {
  return { id: newId(), parent_id, name: "New Team", unit_type: "TEAM", sort_order, competency_codes: [], active_dimension_codes: null, children: [] };
}

const TYPE_OPTIONS: { value: UnitType; label: string }[] = [
  { value: "BUSINESS_UNIT", label: "Business Unit" },
  { value: "DEPARTMENT", label: "Department" },
  { value: "TEAM", label: "Team" },
];

// Per-unit dimension picker rendered as a dropdown. `null` = all dimensions active.
function DimDropdown({
  unit,
  dimensions,
  onChange,
}: {
  unit: LocalUnit;
  dimensions: DimensionOption[];
  onChange: (id: string, codes: string[] | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const active = unit.active_dimension_codes;
  const isAll = active === null;
  const count = isAll ? dimensions.length : active.length;
  const label = isAll ? "All dimensions" : `${count} of ${dimensions.length}`;

  function toggle(code: string) {
    const current = active ?? dimensions.map((d) => d.code);
    const next = current.includes(code)
      ? current.filter((c) => c !== code)
      : [...current, code];
    // Selecting everything collapses back to null (= all active, no override).
    onChange(unit.id, next.length === dimensions.length ? null : next);
  }

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-1 rounded border px-1.5 py-0.5 text-xs transition-colors",
          isAll ? "border-grey-200 text-grey-500 hover:border-velvet" : "border-velvet/40 bg-velvet/5 text-velvet",
        )}
        title="Dimensions assessed for this unit"
      >
        <SlidersHorizontal className="h-3 w-3" />
        <span className="hidden sm:inline">{label}</span>
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-7 z-20 w-56 rounded-lg border border-grey-200 bg-white shadow-elevated p-1.5">
            <div className="flex items-center justify-between px-2 py-1">
              <p className="text-xs font-medium text-grey-500 uppercase tracking-wide">Dimensions</p>
              <button
                type="button"
                onClick={() => onChange(unit.id, null)}
                className="text-xs text-velvet hover:underline"
              >
                All
              </button>
            </div>
            <div className="max-h-64 overflow-auto">
              {dimensions.map((d) => {
                const checked = isAll || active!.includes(d.code);
                return (
                  <button
                    key={d.code}
                    type="button"
                    onClick={() => toggle(d.code)}
                    className="w-full flex items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-grey-700 hover:bg-grey-50"
                  >
                    <span className={cn(
                      "h-3.5 w-3.5 rounded border flex items-center justify-center shrink-0",
                      checked ? "border-velvet bg-velvet" : "border-grey-300",
                    )}>
                      {checked && <Check className="h-2.5 w-2.5 text-white" />}
                    </span>
                    <span className="truncate">{d.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function UnitRow({
  unit,
  depth,
  dimensions,
  onAdd,
  onRename,
  onTypeChange,
  onDimChange,
  onDelete,
}: {
  unit: LocalUnit;
  depth: number;
  dimensions: DimensionOption[];
  onAdd: (parentId: string) => void;
  onRename: (id: string, name: string) => void;
  onTypeChange: (id: string, type: UnitType) => void;
  onDimChange: (id: string, codes: string[] | null) => void;
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

        {/* Dimension picker */}
        {dimensions.length > 0 && (
          <DimDropdown unit={unit} dimensions={dimensions} onChange={onDimChange} />
        )}

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
              dimensions={dimensions}
              onAdd={onAdd}
              onRename={onRename}
              onTypeChange={onTypeChange}
              onDimChange={onDimChange}
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

function dimInTree(units: LocalUnit[], id: string, codes: string[] | null): LocalUnit[] {
  return units.map((u) => {
    if (u.id === id) return { ...u, active_dimension_codes: codes };
    return { ...u, children: dimInTree(u.children, id, codes) };
  });
}

function deleteFromTree(units: LocalUnit[], id: string): LocalUnit[] {
  return units.filter((u) => u.id !== id).map((u) => ({ ...u, children: deleteFromTree(u.children, id) }));
}

export type { LocalUnit };

export function HierarchyBuilder({ units, onChange, dimensions = [] }: Props) {
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
              dimensions={dimensions}
              onAdd={handleAdd}
              onRename={(id, name) => onChange(renameInTree(units, id, name))}
              onTypeChange={(id, type) => onChange(typeInTree(units, id, type))}
              onDimChange={(id, codes) => onChange(dimInTree(units, id, codes))}
              onDelete={(id) => onChange(deleteFromTree(units, id))}
            />
          ))
        )}
      </div>

      <p className="px-4 py-2 text-xs text-grey-400 border-t border-grey-100">
        Double-click a name to rename · Click + to add a child unit · Use the dimensions dropdown to pick which dimensions each unit is assessed on
      </p>
    </div>
  );
}
