"use client";

import React, { useState } from "react";

interface Note {
  id: string;
  text: string;
  author: string;
  createdAt: Date;
  color: string;
}

interface SectionNotesProps {
  sectionId: string;
  notes: Note[];
  onAddNote: (text: string, color: string) => void;
  onDeleteNote: (noteId: string) => void;
}

const NOTE_COLORS = [
  { id: "yellow", bg: "bg-yellow-100 dark:bg-yellow-900/30", border: "border-yellow-300 dark:border-yellow-700" },
  { id: "blue", bg: "bg-blue-100 dark:bg-blue-900/30", border: "border-blue-300 dark:border-blue-700" },
  { id: "green", bg: "bg-green-100 dark:bg-green-900/30", border: "border-green-300 dark:border-green-700" },
  { id: "pink", bg: "bg-pink-100 dark:bg-pink-900/30", border: "border-pink-300 dark:border-pink-700" },
];

/**
 * SectionNotes - Sticky notes for section feedback
 */
export default function SectionNotes({
  sectionId,
  notes,
  onAddNote,
  onDeleteNote,
}: SectionNotesProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [selectedColor, setSelectedColor] = useState("yellow");

  const handleAddNote = () => {
    if (newNote.trim()) {
      onAddNote(newNote.trim(), selectedColor);
      setNewNote("");
    }
  };

  const colorConfig = NOTE_COLORS.find((c) => c.id === selectedColor) || NOTE_COLORS[0];

  return (
    <div className="relative">
      {/* Toggle button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          p-1.5 rounded-md text-xs transition-colors
          ${notes.length > 0
            ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
            : "bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700"
          }
        `}
        title={`${notes.length} note${notes.length !== 1 ? "s" : ""}`}
      >
        💬 {notes.length > 0 && <span className="ml-1">{notes.length}</span>}
      </button>

      {/* Notes panel */}
      {isExpanded && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-sm text-gray-900 dark:text-white">
              Section Notes
            </h4>
          </div>

          {/* Existing notes */}
          <div className="max-h-48 overflow-y-auto p-2 space-y-2">
            {notes.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-2">
                No notes yet
              </p>
            ) : (
              notes.map((note) => {
                const noteColor = NOTE_COLORS.find((c) => c.id === note.color) || NOTE_COLORS[0];
                return (
                  <div
                    key={note.id}
                    className={`p-2 rounded-md border ${noteColor.bg} ${noteColor.border} relative group`}
                  >
                    <p className="text-xs text-gray-700 dark:text-gray-300 pr-6">
                      {note.text}
                    </p>
                    <span className="text-[10px] text-gray-500 mt-1 block">
                      {note.author} · {new Date(note.createdAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => onDeleteNote(note.id)}
                      className="absolute top-1 right-1 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Add new note */}
          <div className="p-3 border-t border-gray-200 dark:border-gray-700">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add a note..."
              rows={2}
              className="w-full px-2 py-1.5 text-xs rounded-md bg-gray-100 dark:bg-gray-700 border-0 focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <div className="flex items-center justify-between mt-2">
              <div className="flex gap-1">
                {NOTE_COLORS.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => setSelectedColor(color.id)}
                    className={`
                      w-5 h-5 rounded-full ${color.bg} ${color.border} border-2
                      ${selectedColor === color.id ? "ring-2 ring-blue-500 ring-offset-1" : ""}
                    `}
                  />
                ))}
              </div>
              <button
                onClick={handleAddNote}
                disabled={!newNote.trim()}
                className="px-3 py-1 text-xs font-medium bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

