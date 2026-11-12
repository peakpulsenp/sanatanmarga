import React from "react";
import { Save, X } from "lucide-react";
import NepaliInput from "@/src/components/ui/NepaliInput";
import { Category } from "@/src/types";

interface CategoryAddRowProps {
  editForm: Partial<Category>;
  setEditForm: React.Dispatch<React.SetStateAction<Partial<Category>>>;
  onSave: () => void;
  onCancel: () => void;
}

export const CategoryAddRow: React.FC<CategoryAddRowProps> = ({
  editForm,
  setEditForm,
  onSave,
  onCancel
}) => {
  return (
    <tr className="bg-primary/5">
      <td className="px-4 py-6 text-center text-muted-text">-</td>
      <td className="px-6 py-6">
        <input 
          type="number" 
          value={editForm.order ?? 0} 
          onChange={(e) => setEditForm(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
          className="w-16 bg-card border border-border-theme rounded-lg px-2 py-1 text-sm text-card-foreground"
        />
      </td>
      <td className="px-8 py-6">
        <NepaliInput 
          value={editForm.nameNepali || ""} 
          onChange={(val) => setEditForm(prev => ({ ...prev, nameNepali: val }))}
          placeholder="नेपाली नाम (उदा. राजनीति)"
          className="w-full bg-card border border-border-theme rounded-lg px-3 py-1 text-sm text-card-foreground"
        />
      </td>
      <td className="px-8 py-6">
        <input 
          type="text" 
          value={editForm.slug || ""} 
          onChange={(e) => setEditForm(prev => ({ ...prev, slug: e.target.value }))}
          placeholder="slug (उदा. politics)"
          className="w-full bg-card border border-border-theme rounded-lg px-3 py-1 text-sm text-card-foreground"
        />
      </td>
      <td className="px-8 py-6">
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
      </td>
      <td className="px-8 py-6">
        <input 
          type="number" 
          value={editForm.postCount || 4} 
          onChange={(e) => setEditForm(prev => ({ ...prev, postCount: parseInt(e.target.value) || 0 }))}
          className="w-16 bg-card border border-border-theme rounded-lg px-2 py-1 text-sm text-card-foreground"
        />
      </td>
      <td className="px-8 py-6">
        <input 
          type="checkbox" 
          checked={editForm.isHidden || false} 
          onChange={(e) => setEditForm(prev => ({ ...prev, isHidden: e.target.checked }))}
          className="w-5 h-5 accent-primary cursor-pointer"
        />
      </td>
      <td className="px-8 py-6 text-right">
        <div className="flex items-center justify-end gap-2">
          <button 
            type="button"
            onClick={onSave} 
            title="सुरक्षित गर्नुहोस्"
            className="p-2 text-green-500 hover:bg-green-500/10 rounded-lg transition-colors"
          >
            <Save size={18} />
          </button>
          <button 
            type="button"
            onClick={onCancel} 
            title="रद्द गर्नुहोस्"
            className="p-2 text-muted-text hover:bg-muted rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </td>
    </tr>
  );
};
