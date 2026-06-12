import * as React from "react";
import { Search } from "lucide-react";
import { Dialog } from "./dialog";

interface CommandItem {
  id: string;
  label: string;
  category: string;
  onSelect: () => void;
  icon?: React.ReactNode;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  items: CommandItem[];
  placeholder?: string;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  items,
  placeholder = "Search commands or scenarios...",
}) => {
  const [search, setSearch] = React.useState("");

  const filteredItems = items.filter((item) =>
    item.label.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase())
  );

  // Group by category
  const categories = Array.from(new Set(filteredItems.map((i) => i.category)));

  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <div className="relative flex items-center border border-zinc-800 rounded-lg bg-zinc-950/80 px-3 py-2.5 mb-4">
        <Search className="mr-2 h-4 w-4 shrink-0 text-zinc-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={placeholder}
          className="flex h-6 w-full rounded-md bg-transparent text-sm outline-none placeholder:text-zinc-500 text-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
        {categories.length === 0 ? (
          <div className="py-6 text-center text-sm text-zinc-500">
            No results found.
          </div>
        ) : (
          categories.map((category) => (
            <div key={category} className="space-y-1">
              <h4 className="px-2 text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">
                {category}
              </h4>
              <div className="space-y-0.5">
                {filteredItems
                  .filter((i) => i.category === category)
                  .map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        item.onSelect();
                        onClose();
                      }}
                      className="w-full text-left flex items-center px-3 py-2 rounded-md hover:bg-zinc-800/80 text-zinc-300 hover:text-zinc-100 transition-colors text-xs"
                    >
                      {item.icon && <span className="mr-2">{item.icon}</span>}
                      {item.label}
                    </button>
                  ))}
              </div>
            </div>
          ))
        )}
      </div>
    </Dialog>
  );
};
