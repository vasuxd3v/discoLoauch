"use client";

export default function InputField({
  label,
  id,
  type = "text",
  placeholder = "",
  value,
  onChange,
  required = false,
  className = "",
  isTextarea = false,
  rows = 4,
}) {
  const inputClasses =
    "w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

  return (
    <div className={`mb-5 ${className}`}>
      <label
        htmlFor={id}
        className="block mb-2 text-sm font-medium text-gray-300"
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {isTextarea ? (
        <textarea
          id={id}
          rows={rows}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={inputClasses}
        />
      ) : (
        <input
          type={type}
          id={id}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={inputClasses}
        />
      )}
    </div>
  );
}
