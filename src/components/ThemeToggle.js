"use client";
import { useState, useEffect } from "react";

export default function ThemeToggle() {
  const [darkMode, setDarkMode] = useState(false);

  // Initialize theme based on system preference or localStorage on component mount
  useEffect(() => {
    // Check if we're in the browser environment
    if (typeof window !== "undefined") {
      // Check if user has a saved preference
      const savedTheme = localStorage.getItem("theme");
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;

      // Set initial state based on localStorage or system preference
      if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
        document.documentElement.classList.add("dark");
        setDarkMode(true);
      } else {
        document.documentElement.classList.remove("dark");
        setDarkMode(false);
      }
    }
  }, []);

  // Toggle theme function
  const toggleTheme = () => {
    if (darkMode) {
      // Switch to light mode
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setDarkMode(false);
    } else {
      // Switch to dark mode
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setDarkMode(true);
    }
  };

  return (
    <button
      onClick={toggleTheme}
      aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
      className="relative w-[76px] h-[40px] bg-[#1e3a8a] dark:bg-[#304ffe] rounded-full overflow-hidden transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {/* Track */}
      <div className="absolute inset-0 bg-blue-900 dark:bg-blue-800 transition-colors duration-300"></div>

      {/* Thumb */}
      <div
        className={`absolute top-1 w-[36px] h-[36px] rounded-full transform transition-transform duration-300 ease-in-out flex items-center justify-center ${
          darkMode
            ? "translate-x-[40px] bg-blue-400"
            : "translate-x-1 bg-blue-600"
        }`}
      >
        {/* Sun/Moon Icon */}
        {darkMode ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-yellow-300"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-yellow-300"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </div>
    </button>
  );
}
