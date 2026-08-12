import { useMemo, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { COUNTRIES, DEFAULT_COUNTRY, flagUrl, formatNationalNumber, type Country } from "@/lib/countries";

type CountryPhoneFieldProps = {
  country: Country;
  value: string;
  onCountryChange: (country: Country) => void;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
};

function CountryFlag({ country, className = "h-5 w-7" }: { country: Country; className?: string }) {
  return (
    <img
      src={flagUrl(country)}
      alt={`${country.name} flag`}
      className={`${className} rounded-[3px] object-cover shadow-[0_0_0_1px_rgba(0,0,0,0.08)]`}
      onError={(event) => {
        event.currentTarget.style.display = "none";
        event.currentTarget.nextElementSibling?.classList.remove("hidden");
      }}
    />
  );
}

export function CountryPhoneField({
  country = DEFAULT_COUNTRY,
  value,
  onCountryChange,
  onValueChange,
  disabled,
  error,
}: CountryPhoneFieldProps) {
  const [countryOpen, setCountryOpen] = useState(false);
  const [search, setSearch] = useState("");
  const formatted = formatNationalNumber(country, value);
  const filteredCountries = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return COUNTRIES;
    return COUNTRIES.filter((item) =>
      `${item.name} ${item.iso2} ${item.dialCode}`.toLowerCase().includes(query),
    );
  }, [search]);

  const chooseCountry = (nextCountry: Country) => {
    onCountryChange(nextCountry);
    onValueChange(value.slice(0, nextCountry.maxDigits));
    setCountryOpen(false);
    setSearch("");
  };

  return (
    <div className="space-y-2">
      <div className={`flex h-14 overflow-hidden rounded-[22px] border bg-white transition-[border,box-shadow] duration-300 ${error ? "border-red-300 ring-4 ring-red-50" : "border-zinc-200 focus-within:border-zinc-400 focus-within:ring-4 focus-within:ring-zinc-100"}`}>
        <button
          type="button"
          aria-label={`Country: ${country.name}. Open country picker`}
          disabled={disabled}
          onClick={() => setCountryOpen(true)}
          className="flex min-w-[96px] items-center gap-1.5 bg-transparent px-3 text-left outline-none transition-colors hover:bg-zinc-50 focus-visible:bg-zinc-50 active:bg-transparent disabled:opacity-50"
          style={{ WebkitTapHighlightColor: "transparent" }}
        >
          <span className="relative flex h-4 w-6 shrink-0 items-center justify-center overflow-hidden">
            <CountryFlag country={country} className="h-4 w-6" />
            <span className="hidden text-base leading-none">{country.flag}</span>
          </span>
          <span className="text-xs font-semibold tabular-nums text-zinc-600">{country.dialCode}</span>
          <ChevronDown className="ml-auto h-3.5 w-3.5 text-zinc-400" />
        </button>
        <input
          inputMode="tel"
          autoComplete="tel-national"
          aria-label={`${country.name} phone number`}
          value={formatted}
          disabled={disabled}
          onChange={(event) => onValueChange(event.target.value.replace(/\D/g, "").slice(0, country.maxDigits))}
          placeholder={country.placeholder}
          className="min-w-0 flex-1 bg-transparent px-4 text-base font-medium tracking-[0.02em] text-zinc-900 outline-none placeholder:text-zinc-300 disabled:opacity-50"
        />
      </div>
      {error && <p className="px-1 text-xs font-medium text-red-600">{error}</p>}

      {countryOpen && (
        <div className="fius-picker-backdrop fixed inset-0 z-[300] flex items-end justify-center bg-zinc-900/30 p-0 backdrop-blur-[2px] sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label="Choose your country">
          <button type="button" aria-label="Close country picker" className="absolute inset-0 cursor-default" onClick={() => setCountryOpen(false)} />
          <div className="fius-picker-panel relative flex max-h-[min(680px,88vh)] w-full max-w-md flex-col overflow-hidden rounded-t-[34px] border border-zinc-200 bg-white shadow-[0_28px_90px_rgba(0,0,0,0.2)] sm:rounded-[34px]">
            <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
              <div>
                <h2 className="text-base font-bold text-zinc-900">Choose your country</h2>
                <p className="mt-0.5 text-xs text-zinc-400">Your country code formats the number automatically.</p>
              </div>
              <button type="button" onClick={() => setCountryOpen(false)} className="rounded-full p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="border-b border-zinc-100 px-5 py-3">
              <div className="flex h-11 items-center gap-2 rounded-xl bg-zinc-50 px-3 ring-1 ring-inset ring-zinc-200 focus-within:ring-zinc-400">
                <Search className="h-4 w-4 text-zinc-400" />
                <input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search country or code" className="min-w-0 flex-1 bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400" />
              </div>
            </div>
            <div className="overflow-y-auto p-2">
              {filteredCountries.map((item) => {
                const selected = item.iso2 === country.iso2 && item.dialCode === country.dialCode;
                return (
                  <button key={`${item.iso2}-${item.dialCode}`} type="button" onClick={() => chooseCountry(item)} className="fius-picker-row flex w-full items-center gap-3 rounded-2xl bg-transparent px-3 py-3 text-left outline-none transition-colors hover:bg-zinc-50 focus-visible:bg-zinc-50 active:bg-transparent" data-selected={selected || undefined} style={{ WebkitTapHighlightColor: "transparent", animationDelay: `${Math.min(180, filteredCountries.indexOf(item) * 8)}ms` }}>
                    <span className="relative flex h-6 w-8 shrink-0 items-center justify-center overflow-hidden">
                      <CountryFlag country={item} className="h-5 w-7" />
                      <span className="hidden text-xl leading-none">{item.flag}</span>
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-800">{item.name}</span>
                    <span className="text-sm tabular-nums text-zinc-400">{item.dialCode}</span>
                    {selected && <Check className="h-4 w-4 text-zinc-900" />}
                  </button>
                );
              })}
              {!filteredCountries.length && <p className="px-3 py-10 text-center text-sm text-zinc-400">No country found.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function toE164(country: Country, nationalNumber: string) {
  return `${country.dialCode}${nationalNumber.replace(/\D/g, "")}`;
}