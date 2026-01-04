"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { formatDistanceToNow } from "date-fns";
import type { ReviewRequest } from "@/lib/types";

export type NotificationType = "mention" | "review_request" | "approval" | "rejection" | "comment" | "edit" | "system" | "review_complete" | "review_reminder";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  fromUser?: string;
  blockId?: string;
  blockTitle?: string;
  createdAt: Date;
  read: boolean;
  actionUrl?: string;
  reviewRequestId?: string; // Link to review request
  dueDate?: Date; // For SLA tracking
}

interface NotificationCenterProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onNotificationClick?: (notification: Notification) => void;
}

const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  mention: "💬",
  review_request: "📝",
  approval: "✅",
  rejection: "❌",
  comment: "💭",
  edit: "✏️",
  system: "🔔",
  review_complete: "🎉",
  review_reminder: "⏰",
};

const NOTIFICATION_COLORS: Record<NotificationType, string> = {
  mention: "bg-blue-500",
  review_request: "bg-amber-500",
  approval: "bg-emerald-500",
  rejection: "bg-red-500",
  comment: "bg-purple-500",
  edit: "bg-cyan-500",
  system: "bg-slate-500",
  review_complete: "bg-green-500",
  review_reminder: "bg-orange-500",
};

/**
 * NotificationBell - Bell icon with badge for unread count
 */
export function NotificationBell({
  unreadCount,
  onClick,
}: {
  unreadCount: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="relative p-2 hover:bg-slate-700 rounded-lg transition-colors"
      title="Notifications"
    >
      <svg
        className="w-5 h-5 text-slate-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </button>
  );
}

/**
 * NotificationDropdown - Dropdown panel for notifications
 */
export function NotificationDropdown({
  isOpen,
  notifications,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  onNotificationClick,
}: NotificationCenterProps & { isOpen: boolean; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isOpen && !(e.target as Element).closest("[data-notification-dropdown]")) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  if (!mounted || !isOpen) return null;

  const unreadNotifications = notifications.filter((n) => !n.read);
  const readNotifications = notifications.filter((n) => n.read);

  return createPortal(
    <div
      data-notification-dropdown
      className="fixed top-16 right-4 z-[9999] w-[400px] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-slate-800/50">
        <h3 className="text-sm font-semibold text-white">Notifications</h3>
        <div className="flex items-center gap-2">
          {unreadNotifications.length > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={onClearAll}
              className="text-xs text-slate-500 hover:text-slate-400 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Notifications list */}
      <div className="max-h-[400px] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="py-12 text-center">
            <span className="text-4xl block mb-2">🔔</span>
            <p className="text-slate-500 text-sm">No notifications yet</p>
          </div>
        ) : (
          <>
            {/* Unread */}
            {unreadNotifications.length > 0 && (
              <div>
                <div className="px-4 py-2 bg-slate-800/30 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  New ({unreadNotifications.length})
                </div>
                {unreadNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={onMarkAsRead}
                    onClick={onNotificationClick}
                  />
                ))}
              </div>
            )}

            {/* Read */}
            {readNotifications.length > 0 && (
              <div>
                <div className="px-4 py-2 bg-slate-800/30 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Earlier
                </div>
                {readNotifications.slice(0, 10).map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={onMarkAsRead}
                    onClick={onNotificationClick}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>,
    document.body
  );
}

function NotificationItem({
  notification,
  onMarkAsRead,
  onClick,
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onClick?: (notification: Notification) => void;
}) {
  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
    onClick?.(notification);
  };

  return (
    <div
      onClick={handleClick}
      className={`
        px-4 py-3 border-b border-slate-800 cursor-pointer transition-colors
        ${notification.read ? "opacity-60 hover:opacity-100" : "bg-blue-500/5 hover:bg-blue-500/10"}
      `}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-8 h-8 rounded-full ${NOTIFICATION_COLORS[notification.type]} flex items-center justify-center text-white text-sm shrink-0`}
        >
          {NOTIFICATION_ICONS[notification.type]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white truncate">
              {notification.title}
            </span>
            {!notification.read && (
              <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0" />
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
            {notification.message}
          </p>
          {notification.blockTitle && (
            <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-slate-800 rounded text-xs text-slate-400">
              📄 {notification.blockTitle}
            </span>
          )}
          <p className="text-xs text-slate-500 mt-1">
            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * useNotifications - Hook to manage notifications
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("content-visualizer-notifications");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setNotifications(
          parsed.map((n: Notification) => ({
            ...n,
            createdAt: new Date(n.createdAt),
          }))
        );
      } catch (e) {
        console.error("Failed to parse notifications:", e);
      }
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem("content-visualizer-notifications", JSON.stringify(notifications));
  }, [notifications]);

  const addNotification = (notification: Omit<Notification, "id" | "createdAt" | "read">) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      read: false,
    };
    setNotifications((prev) => [newNotification, ...prev]);
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  // Create review request notification
  const createReviewRequestNotification = useCallback((request: ReviewRequest, blockTitles: string[]) => {
    addNotification({
      type: "review_request",
      title: "New Review Request",
      message: `${request.requestedBy.name} requests review for ${request.blockIds.length} block(s): ${blockTitles.slice(0, 2).join(", ")}${blockTitles.length > 2 ? "..." : ""}`,
      fromUser: request.requestedBy.name,
      blockTitle: blockTitles[0],
      reviewRequestId: request.id,
      dueDate: request.dueBy,
    });
  }, [addNotification]);

  // Create review complete notification (for requester)
  const createReviewCompleteNotification = useCallback((
    request: ReviewRequest,
    resolution: "APPROVED" | "NEEDS_CHANGES",
    comment?: string
  ) => {
    addNotification({
      type: resolution === "APPROVED" ? "approval" : "rejection",
      title: resolution === "APPROVED" ? "Content Approved!" : "Changes Requested",
      message: comment || (resolution === "APPROVED" 
        ? `Your review request was approved by ${request.reviewerName}`
        : `${request.reviewerName} requested changes to your content`),
      fromUser: request.reviewerName,
      reviewRequestId: request.id,
    });
  }, [addNotification]);

  // Create reminder notification for overdue reviews
  const createReviewReminderNotification = useCallback((request: ReviewRequest) => {
    addNotification({
      type: "review_reminder",
      title: "Review Overdue",
      message: `Review request from ${request.requestedBy.name} is past due date`,
      fromUser: request.requestedBy.name,
      reviewRequestId: request.id,
      dueDate: request.dueBy,
    });
  }, [addNotification]);

  return {
    notifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    unreadCount,
    isOpen,
    setIsOpen,
    toggleOpen: () => setIsOpen((prev) => !prev),
    // Review-specific helpers
    createReviewRequestNotification,
    createReviewCompleteNotification,
    createReviewReminderNotification,
  };
}

export default NotificationDropdown;

