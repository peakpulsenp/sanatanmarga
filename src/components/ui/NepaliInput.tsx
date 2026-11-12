import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { transliterate, fetchSuggestions } from "@/src/lib/nepaliTransliteration";
import { Languages, ChevronDown } from "lucide-react";

interface NepaliInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  type?: "text" | "textarea";
  rows?: number;
  id?: string;
  name?: string;
  required?: boolean;
}

const NepaliInput = forwardRef<HTMLInputElement | HTMLTextAreaElement, NepaliInputProps>(({ 
  value, 
  onChange, 
  placeholder, 
  className, 
  style,
  type = "text",
  rows = 3,
  id,
  name,
  required = false
}, ref) => {
  const [isNepali, setIsNepali] = useState(true);
  const [internalValue, setInternalValue] = useState(value);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentWord, setCurrentWord] = useState("");
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const internalRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useImperativeHandle(ref, () => internalRef.current as any);

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  useEffect(() => {
    const updatePosition = () => {
      if (showSuggestions && internalRef.current) {
        const rect = internalRef.current.getBoundingClientRect();
        const showAbove = rect.top > 200;
        setDropdownStyle({
          position: 'fixed',
          left: `${Math.max(12, rect.left)}px`,
          width: `${Math.min(window.innerWidth - 24, Math.max(rect.width, 320))}px`,
          ...(showAbove 
            ? { bottom: `${window.innerHeight - rect.top + 6}px` } 
            : { top: `${rect.bottom + 6}px` }),
          zIndex: 999999,
        });
      }
    };

    if (showSuggestions) {
      updatePosition();
      window.addEventListener("resize", updatePosition);
      window.addEventListener("scroll", updatePosition, true);
    }

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [showSuggestions, suggestions]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        internalRef.current && 
        !internalRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    if (showSuggestions) {
      document.addEventListener("mousedown", handleOutsideClick);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [showSuggestions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    const cursorPosition = e.target.selectionStart || 0;
    
    if (!isNepali) {
      setInternalValue(newVal);
      onChange(newVal);
      return;
    }

    const textBeforeCursor = newVal.substring(0, cursorPosition);
    const textAfterCursor = newVal.substring(cursorPosition);
    
    // Find the last word boundary before the cursor
    const lastSpaceIndex = Math.max(
      textBeforeCursor.lastIndexOf(" "), 
      textBeforeCursor.lastIndexOf("\n"), 
      textBeforeCursor.lastIndexOf("<"),
      textBeforeCursor.lastIndexOf(">"),
      -1
    );
    
    const word = textBeforeCursor.substring(lastSpaceIndex + 1);

    // If the user just typed a space or punctuation after a word
    if (word === "" && textBeforeCursor.length > 0) {
      const lastChar = textBeforeCursor.slice(-1);
      if (lastChar === " " || lastChar === "\n" || lastChar === "।" || lastChar === ",") {
        // Find the word before this punctuation
        const textBeforePunc = textBeforeCursor.slice(0, -1);
        const prevSpaceIndex = Math.max(
          textBeforePunc.lastIndexOf(" "), 
          textBeforePunc.lastIndexOf("\n"),
          textBeforePunc.lastIndexOf(">"),
          -1
        );
        const prevWord = textBeforePunc.substring(prevSpaceIndex + 1);
        
        if (prevWord && /^[a-zA-Z]+$/.test(prevWord)) {
          const transliteratedWord = transliterate(prevWord);
          const newText = 
            textBeforePunc.substring(0, prevSpaceIndex + 1) + 
            transliteratedWord + 
            lastChar + 
            textAfterCursor;
          
          setInternalValue(newText);
          onChange(newText);
          setShowSuggestions(false);
          
          // Restore cursor position after a short delay to allow React to render
          setTimeout(() => {
            if (internalRef.current) {
              const newCursorPos = prevSpaceIndex + 1 + transliteratedWord.length + 1;
              internalRef.current.setSelectionRange(newCursorPos, newCursorPos);
            }
          }, 0);
          return;
        }
      }
    }

    // Synchronously update the value so cursor doesn't jump
    setInternalValue(newVal);
    onChange(newVal);

    if (word && /^[a-zA-Z]+$/.test(word)) {
      setCurrentWord(word);
      // Fetch suggestions asynchronously
      fetchSuggestions(word).then(fetched => {
        // Only show suggestions if the word hasn't changed
        if (internalRef.current) {
          const currentCursor = internalRef.current.selectionStart || 0;
          const currentTextBefore = internalRef.current.value.substring(0, currentCursor);
          const currentLastSpace = Math.max(
            currentTextBefore.lastIndexOf(" "), 
            currentTextBefore.lastIndexOf("\n"), 
            currentTextBefore.lastIndexOf("<"),
            currentTextBefore.lastIndexOf(">"),
            -1
          );
          const currentWord = currentTextBefore.substring(currentLastSpace + 1);
          
          if (currentWord === word) {
            setSuggestions(fetched);
            setShowSuggestions(true);
          }
        }
      });
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    const cursorPosition = internalRef.current?.selectionStart || internalValue.length;
    const textBeforeCursor = internalValue.substring(0, cursorPosition);
    const textAfterCursor = internalValue.substring(cursorPosition);
    
    // Trim trailing spaces if space was just pressed
    const trimmedBefore = textBeforeCursor.trimEnd();
    const lastSpaceIndex = Math.max(
      trimmedBefore.lastIndexOf(" "), 
      trimmedBefore.lastIndexOf("\n"), 
      trimmedBefore.lastIndexOf("<"),
      trimmedBefore.lastIndexOf(">"),
      -1
    );
    
    const prefix = trimmedBefore.substring(0, lastSpaceIndex + 1);
    const newValue = prefix + suggestion + " " + textAfterCursor.trimStart();
    
    setInternalValue(newValue);
    onChange(newValue);
    setShowSuggestions(false);
    
    setTimeout(() => {
      if (internalRef.current) {
        internalRef.current.focus();
        const newCursorPos = prefix.length + suggestion.length + 1;
        internalRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        handleSuggestionClick(suggestions[0]);
      } else if (e.key === "Escape") {
        setShowSuggestions(false);
      }
    }
  };

  return (
    <div className="relative w-full group">
      <button
        type="button"
        onClick={() => setIsNepali(!isNepali)}
        className={`absolute right-3 top-3 z-10 p-1.5 rounded-lg transition-all flex items-center gap-1.5 text-xxs font-black uppercase tracking-widest ${
          isNepali ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-muted-area text-muted-text hover:bg-muted-area/80 border border-border-theme/50"
        }`}
        title={isNepali ? "Switch to English" : "Switch to Nepali"}
      >
        <Languages size={12} />
        {isNepali ? "NE" : "EN"}
      </button>
      
      {type === "text" ? (
        <input
          ref={internalRef as React.RefObject<HTMLInputElement>}
          id={id}
          name={name}
          required={required}
          type="text"
          value={internalValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={className}
          style={style}
        />
      ) : (
        <textarea
          ref={internalRef as React.RefObject<HTMLTextAreaElement>}
          id={id}
          name={name}
          required={required}
          value={internalValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={className}
          rows={rows}
          style={style}
        />
      )}

      {showSuggestions && suggestions.length > 0 && (
        <div style={dropdownStyle} className="bg-card border border-border-theme rounded-xl shadow-2xl p-2 flex flex-wrap gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSuggestionClick(s)}
              className="px-3 py-1.5 rounded-lg hover:bg-primary/10 hover:text-primary text-sm font-medium transition-colors border border-transparent hover:border-border-theme text-card-foreground"
            >
              {s}
            </button>
          ))}
          <div className="w-full border-t border-border-theme mt-1 pt-1 flex items-center justify-between px-2">
            <span className="text-xxs text-muted-text uppercase font-black tracking-widest">Suggestions</span>
            <ChevronDown size={10} className="text-muted-text/30" />
          </div>
        </div>
      )}
    </div>
  );
});

export default NepaliInput;
