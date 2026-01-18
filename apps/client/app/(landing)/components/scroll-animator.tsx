"use client";

import { useEffect } from "react";

export function ScrollAnimator(): null {
  useEffect(() => {
    // Smooth scroll for anchor links
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLAnchorElement;
      if (!target.matches('a[href^="#"]')) return;

      const href = target.getAttribute("href");
      if (!href || href === "#") return;

      e.preventDefault();
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    // Intersection Observer for scroll animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, index) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              entry.target.classList.add("visible");
            }, index * 50);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    // Observe all elements with animate-on-scroll class
    const elements = document.querySelectorAll(".animate-on-scroll");
    elements.forEach((el) => observer.observe(el));

    // Add smooth scroll listener
    document.addEventListener("click", handleAnchorClick);

    return () => {
      elements.forEach((el) => observer.unobserve(el));
      document.removeEventListener("click", handleAnchorClick);
    };
  }, []);

  return null;
}
