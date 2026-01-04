"use client";

import React, { useState, useEffect, useRef } from "react";

interface PageTransitionProps {
  children: React.ReactNode;
  pageKey: string;
  className?: string;
  duration?: number;
  type?: "fade" | "slide" | "scale" | "blur";
}

/**
 * PageTransition - Smooth animated transitions between views
 */
export function PageTransition({
  children,
  pageKey,
  className = "",
  duration = 200,
  type = "fade",
}: PageTransitionProps) {
  const [displayedKey, setDisplayedKey] = useState(pageKey);
  const [displayedChildren, setDisplayedChildren] = useState(children);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [phase, setPhase] = useState<"enter" | "exit">("enter");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (pageKey !== displayedKey) {
      // Start exit animation
      setIsTransitioning(true);
      setPhase("exit");

      // After exit animation, switch content
      timeoutRef.current = setTimeout(() => {
        setDisplayedKey(pageKey);
        setDisplayedChildren(children);
        setPhase("enter");

        // After enter animation completes
        timeoutRef.current = setTimeout(() => {
          setIsTransitioning(false);
        }, duration);
      }, duration);
    } else {
      // Just update children if key is same
      setDisplayedChildren(children);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [pageKey, children, displayedKey, duration]);

  const getTransitionStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      transition: `all ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
    };

    if (!isTransitioning) {
      return {
        ...baseStyles,
        opacity: 1,
        transform: "none",
        filter: "none",
      };
    }

    switch (type) {
      case "fade":
        return {
          ...baseStyles,
          opacity: phase === "exit" ? 0 : 1,
        };
      case "slide":
        return {
          ...baseStyles,
          opacity: phase === "exit" ? 0 : 1,
          transform: phase === "exit" ? "translateY(12px)" : "translateY(0)",
        };
      case "scale":
        return {
          ...baseStyles,
          opacity: phase === "exit" ? 0 : 1,
          transform: phase === "exit" ? "scale(0.98)" : "scale(1)",
        };
      case "blur":
        return {
          ...baseStyles,
          opacity: phase === "exit" ? 0 : 1,
          filter: phase === "exit" ? "blur(4px)" : "blur(0)",
          transform: phase === "exit" ? "scale(0.99)" : "scale(1)",
        };
      default:
        return baseStyles;
    }
  };

  return (
    <div className={`${className}`} style={getTransitionStyles()}>
      {displayedChildren}
    </div>
  );
}

/**
 * FadeIn - Simple fade-in animation on mount
 */
export function FadeIn({
  children,
  delay = 0,
  duration = 300,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timeout);
  }, [delay]);

  return (
    <div
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(8px)",
        transition: `all ${duration}ms cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/**
 * StaggeredList - Animate list items with staggered delays
 */
export function StaggeredList({
  children,
  staggerDelay = 50,
  initialDelay = 0,
  className = "",
}: {
  children: React.ReactNode[];
  staggerDelay?: number;
  initialDelay?: number;
  className?: string;
}) {
  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => (
        <FadeIn key={index} delay={initialDelay + index * staggerDelay}>
          {child}
        </FadeIn>
      ))}
    </div>
  );
}

/**
 * SlideIn - Slide in from a direction
 */
export function SlideIn({
  children,
  direction = "up",
  delay = 0,
  duration = 300,
  className = "",
}: {
  children: React.ReactNode;
  direction?: "up" | "down" | "left" | "right";
  delay?: number;
  duration?: number;
  className?: string;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timeout);
  }, [delay]);

  const getTransform = () => {
    if (isVisible) return "translate(0, 0)";
    switch (direction) {
      case "up":
        return "translateY(20px)";
      case "down":
        return "translateY(-20px)";
      case "left":
        return "translateX(20px)";
      case "right":
        return "translateX(-20px)";
      default:
        return "translateY(20px)";
    }
  };

  return (
    <div
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: getTransform(),
        transition: `all ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
      }}
    >
      {children}
    </div>
  );
}

/**
 * ScaleIn - Scale in animation
 */
export function ScaleIn({
  children,
  delay = 0,
  duration = 300,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timeout);
  }, [delay]);

  return (
    <div
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "scale(1)" : "scale(0.95)",
        transition: `all ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
      }}
    >
      {children}
    </div>
  );
}


