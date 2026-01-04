"use client";

import React, { useState, useRef, useEffect } from "react";

interface EditableTextProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  multiline?: boolean;
}

/**
 * EditableText - Inline editable text component
 * Click to edit, blur or Enter to save
 */
export default function EditableText({
  value,
  onChange,
  placeholder = "Click to edit...",
  className = "",
  as: Component = "span",
  multiline = false,
}: EditableTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (editValue !== value) {
      onChange(editValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !multiline) {
      e.preventDefault();
      handleBlur();
    }
    if (e.key === "Escape") {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    const InputComponent = multiline ? "textarea" : "input";
    return (
      <InputComponent
        ref={inputRef as React.RefObject<HTMLInputElement & HTMLTextAreaElement>}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`
          bg-transparent border-b-2 border-blue-500 outline-none
          w-full resize-none
          ${className}
        `}
        placeholder={placeholder}
        rows={multiline ? 3 : undefined}
        onClick={(e) => e.stopPropagation()}
      />
    );
  }

  return (
    <Component
      onClick={handleClick}
      className={`
        cursor-text hover:bg-white/5 rounded px-1 -mx-1 transition-colors
        ${!value ? "text-gray-500 italic" : ""}
        ${className}
      `}
      title="Click to edit"
    >
      {value || placeholder}
    </Component>
  );
}

