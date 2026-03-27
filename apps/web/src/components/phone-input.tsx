"use client";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function PhoneInput({ value, onChange, error }: PhoneInputProps) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">Numéro de téléphone</label>
      <div className="flex">
        <span className="inline-flex items-center px-4 h-12 border-2 border-r-0 border-gray-200 rounded-l-btn bg-gray-50 text-sm font-medium text-gray-600">
          +223
        </span>
        <input
          type="tel"
          inputMode="numeric"
          placeholder="XX XX XX XX"
          maxLength={8}
          value={value}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "").slice(0, 8);
            onChange(v);
          }}
          className="flex-1 h-12 border-2 border-gray-200 rounded-r-btn px-4 text-sm focus:border-musso-pink focus:outline-none transition-colors"
        />
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
