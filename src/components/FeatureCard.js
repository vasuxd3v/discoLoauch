"use client";

import { useRouter } from "next/navigation";

export default function FeatureCard({
  title,
  description,
  icon,
  buttonText = "Use Tool",
  toolPath,
}) {
  const router = useRouter();

  const handleButtonClick = () => {
    if (toolPath) {
      router.push(toolPath);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 transition-all hover:shadow-xl hover:-translate-y-1">
      <div className="flex flex-col h-full">
        <div className="mb-4 text-blue-600 dark:text-blue-400">{icon}</div>

        <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">
          {title}
        </h3>

        <p className="text-gray-600 dark:text-gray-300 mb-6 flex-grow">
          {description}
        </p>

        <button
          onClick={handleButtonClick}
          className="mt-auto w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2 px-4 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all focus:ring-2 focus:ring-blue-300 focus:outline-none"
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
}
