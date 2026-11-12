import React from "react";
import { Draggable } from "@hello-pangea/dnd";
import { GripVertical, ChevronUp, ChevronDown, Edit, Trash2, Save, X } from "lucide-react";
import NepaliInput from "@/src/components/ui/NepaliInput";
import { Category } from "@/src/types";

interface CategoryItemRowProps {
  cat: Category;
  index: number;
  totalCount: number;
  editingId: string | null;
  editForm: Partial<Category>;
  setEditForm: React.Dispatch<React.SetStateAction<Partial<Category>>>;
  onEdit: (cat: Category) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: (id: string) => void;
  onMove: (index: number, direction: 'up' | 'down') => void;
}

export const CategoryItemRow: React.FC<CategoryItemRowProps> = ({
  cat,
  index,
  totalCount,
  editingId,
  editForm,
  setEditForm,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onMove
}) => {
  const isEditing = editingId === cat.id;
  const uniqueKey = cat.id ? String(cat.id) : (cat.slug ? `slug-${cat.slug}` : `cat-${index}`);

  return (
    <Draggable key={uniqueKey} draggableId={uniqueKey} index={index}>
      {(provided, snapshot) => (
        <tr 
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`transition-colors group ${
            snapshot.isDragging 
              ? "bg-primary/10 border-2 border-primary shadow-2xl rounded-2xl z-50" 
              : "hover:bg-muted-area/50"
          }`}
        >
          <td className="px-4 py-6 text-center">
            <div
              {...provided.dragHandleProps}
              title="समातेर ड्रयाग गर्नुहोस्"
              className="cursor-grab active:cursor-grabbing p-1.5 text-muted-text hover:text-primary rounded-lg hover:bg-primary/10 transition-colors inline-flex items-center justify-center"
            >
              <GripVertical size={18} />
            </div>
          </td>
          <td className="px-6 py-6">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-muted-text w-5 text-center">
                {index + 1}
              </span>
              <div className="flex flex-col gap-0.5">
                <button 
                  type="button"
                  onClick={() => onMove(index, 'up')}
                  disabled={index === 0}
                  title="माथि सार्नुहोस्"
                  className="p-0.5 rounded text-muted-text hover:text-primary hover:bg-primary/10 disabled:opacity-20 disabled:pointer-events-none transition-colors"
                >
                  <ChevronUp size={14} />
                </button>
                <button 
                  type="button"
                  onClick={() => onMove(index, 'down')}
                  disabled={index === totalCount - 1}
                  title="तल सार्नुहोस्"
                  className="p-0.5 rounded text-muted-text hover:text-primary hover:bg-primary/10 disabled:opacity-20 disabled:pointer-events-none transition-colors"
                >
                  <ChevronDown size={14} />
                </button>
              </div>
            </div>
          </td>
          <td className="px-8 py-6">
            {isEditing ? (
              <NepaliInput 
                value={editForm.nameNepali || ""} 
                onChange={(val) => setEditForm(prev => ({ ...prev, nameNepali: val }))}
                className="w-full bg-card border border-border-theme rounded-lg px-3 py-1 text-sm font-bold text-card-foreground"
              />
            ) : (
              <div className="flex flex-col">
                <span className="text-sm font-bold text-card-foreground">{cat.nameNepali}</span>
                {cat.nameEnglish && <span className="text-xxs text-muted-text">{cat.nameEnglish}</span>}
              </div>
            )}
          </td>
          <td className="px-8 py-6">
            {isEditing ? (
              <input 
                type="text" 
                value={editForm.slug || ""} 
                onChange={(e) => setEditForm(prev => ({ ...prev, slug: e.target.value }))}
                className="w-full bg-card border border-border-theme rounded-lg px-3 py-1 text-sm text-card-foreground"
              />
            ) : (
              <span className="text-sm text-muted-text font-mono">{cat.slug}</span>
            )}
          </td>
          <td className="px-8 py-6">
            {isEditing ? (
              <select 
                value={editForm.homepageStyle || "grid"} 
                onChange={(e) => setEditForm(prev => ({ ...prev, homepageStyle: e.target.value as any }))}
                className="w-full bg-card border border-border-theme rounded-lg px-3 py-1 text-sm text-card-foreground"
              >
                <option value="grid">Grid (2x2)</option>
                <option value="featured_list">Featured + List</option>
                <option value="cards">Cards (4x1)</option>
                <option value="alternating">Alternating Row</option>
                <option value="magazine">Magazine</option>
                <option value="masonry">Masonry</option>
                <option value="overlay">Overlay</option>
              </select>
            ) : (
              <span className="text-xs font-bold text-muted-text uppercase tracking-widest">
                {cat.homepageStyle || "grid"}
              </span>
            )}
          </td>
          <td className="px-8 py-6">
            {isEditing ? (
              <input 
                type="number" 
                value={editForm.postCount || 4} 
                onChange={(e) => setEditForm(prev => ({ ...prev, postCount: parseInt(e.target.value) || 0 }))}
                className="w-16 bg-card border border-border-theme rounded-lg px-2 py-1 text-sm text-card-foreground"
              />
            ) : (
              <span className="text-sm font-bold text-muted-text">{cat.postCount || 0}</span>
            )}
          </td>
          <td className="px-8 py-6">
            {isEditing ? (
              <input 
                type="checkbox" 
                checked={editForm.isHidden || false} 
                onChange={(e) => setEditForm(prev => ({ ...prev, isHidden: e.target.checked }))}
                className="w-5 h-5 accent-primary cursor-pointer"
              />
            ) : (
              <span className={`text-xxs font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${cat.isHidden ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'}`}>
                {cat.isHidden ? 'लुकाइएको' : 'देखिने'}
              </span>
            )}
          </td>
          <td className="px-8 py-6 text-right">
            {isEditing ? (
              <div className="flex items-center justify-end gap-2">
                <button type="button" onClick={onSave} title="सुरक्षित गर्नुहोस्" className="p-2 text-green-500 hover:bg-green-500/10 rounded-lg transition-colors">
                  <Save size={18} />
                </button>
                <button type="button" onClick={onCancel} title="रद्द गर्नुहोस्" className="p-2 text-muted-text hover:bg-muted rounded-lg transition-colors">
                  <X size={18} />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-end gap-2">
                <button type="button" onClick={() => onEdit(cat)} title="सम्पादन गर्नुहोस्" className="p-2 text-muted-text hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                  <Edit size={18} />
                </button>
                <button type="button" onClick={() => onDelete(cat.id)} title="हटाउनुहोस्" className="p-2 text-muted-text hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
            )}
          </td>
        </tr>
      )}
    </Draggable>
  );
};
