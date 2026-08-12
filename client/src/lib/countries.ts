export type Country = {
  iso2: string;
  name: string;
  dialCode: string;
  flag: string;
  minDigits: number;
  maxDigits: number;
  groupSizes: number[];
  placeholder: string;
};

// Keep the phone rules here instead of relying on a browser locale. This makes
// the input predictable on Replit's preview, mobile browsers, and desktop.
export const COUNTRIES: Country[] = [
  { iso2: "PK", name: "Pakistan", dialCode: "+92", flag: "🇵🇰", minDigits: 10, maxDigits: 10, groupSizes: [3, 3, 4], placeholder: "300 123 4567" },
  { iso2: "US", name: "United States", dialCode: "+1", flag: "🇺🇸", minDigits: 10, maxDigits: 10, groupSizes: [3, 3, 4], placeholder: "201 555 0123" },
  { iso2: "CA", name: "Canada", dialCode: "+1", flag: "🇨🇦", minDigits: 10, maxDigits: 10, groupSizes: [3, 3, 4], placeholder: "416 555 0123" },
  { iso2: "GB", name: "United Kingdom", dialCode: "+44", flag: "🇬🇧", minDigits: 10, maxDigits: 10, groupSizes: [4, 3, 3], placeholder: "7911 123 456" },
  { iso2: "IN", name: "India", dialCode: "+91", flag: "🇮🇳", minDigits: 10, maxDigits: 10, groupSizes: [5, 5], placeholder: "98765 43210" },
  { iso2: "AE", name: "United Arab Emirates", dialCode: "+971", flag: "🇦🇪", minDigits: 9, maxDigits: 9, groupSizes: [2, 3, 4], placeholder: "50 123 4567" },
  { iso2: "SA", name: "Saudi Arabia", dialCode: "+966", flag: "🇸🇦", minDigits: 9, maxDigits: 9, groupSizes: [2, 3, 4], placeholder: "50 123 4567" },
  { iso2: "AU", name: "Australia", dialCode: "+61", flag: "🇦🇺", minDigits: 9, maxDigits: 9, groupSizes: [3, 3, 3], placeholder: "412 345 678" },
  { iso2: "NZ", name: "New Zealand", dialCode: "+64", flag: "🇳🇿", minDigits: 8, maxDigits: 10, groupSizes: [3, 3, 4], placeholder: "21 123 4567" },
  { iso2: "BD", name: "Bangladesh", dialCode: "+880", flag: "🇧🇩", minDigits: 10, maxDigits: 10, groupSizes: [4, 3, 3], placeholder: "1712 345 678" },
  { iso2: "LK", name: "Sri Lanka", dialCode: "+94", flag: "🇱🇰", minDigits: 9, maxDigits: 9, groupSizes: [2, 3, 4], placeholder: "71 234 5678" },
  { iso2: "NP", name: "Nepal", dialCode: "+977", flag: "🇳🇵", minDigits: 10, maxDigits: 10, groupSizes: [3, 3, 4], placeholder: "984 123 4567" },
  { iso2: "AF", name: "Afghanistan", dialCode: "+93", flag: "🇦🇫", minDigits: 9, maxDigits: 9, groupSizes: [3, 3, 3], placeholder: "70 123 4567" },
  { iso2: "TR", name: "Türkiye", dialCode: "+90", flag: "🇹🇷", minDigits: 10, maxDigits: 10, groupSizes: [3, 3, 2, 2], placeholder: "501 234 56 78" },
  { iso2: "DE", name: "Germany", dialCode: "+49", flag: "🇩🇪", minDigits: 10, maxDigits: 11, groupSizes: [3, 4, 4], placeholder: "151 2345 6789" },
  { iso2: "FR", name: "France", dialCode: "+33", flag: "🇫🇷", minDigits: 9, maxDigits: 9, groupSizes: [1, 2, 2, 2, 2], placeholder: "6 12 34 56 78" },
  { iso2: "IT", name: "Italy", dialCode: "+39", flag: "🇮🇹", minDigits: 9, maxDigits: 10, groupSizes: [3, 3, 4], placeholder: "312 345 6789" },
  { iso2: "ES", name: "Spain", dialCode: "+34", flag: "🇪🇸", minDigits: 9, maxDigits: 9, groupSizes: [3, 3, 3], placeholder: "612 345 678" },
  { iso2: "PT", name: "Portugal", dialCode: "+351", flag: "🇵🇹", minDigits: 9, maxDigits: 9, groupSizes: [3, 3, 3], placeholder: "912 345 678" },
  { iso2: "NL", name: "Netherlands", dialCode: "+31", flag: "🇳🇱", minDigits: 9, maxDigits: 9, groupSizes: [2, 3, 4], placeholder: "6 123 4567" },
  { iso2: "BE", name: "Belgium", dialCode: "+32", flag: "🇧🇪", minDigits: 9, maxDigits: 9, groupSizes: [3, 2, 2, 2], placeholder: "471 12 34 56" },
  { iso2: "CH", name: "Switzerland", dialCode: "+41", flag: "🇨🇭", minDigits: 9, maxDigits: 9, groupSizes: [2, 3, 2, 2], placeholder: "79 123 45 67" },
  { iso2: "AT", name: "Austria", dialCode: "+43", flag: "🇦🇹", minDigits: 10, maxDigits: 10, groupSizes: [3, 3, 2, 2], placeholder: "664 123 45 67" },
  { iso2: "SE", name: "Sweden", dialCode: "+46", flag: "🇸🇪", minDigits: 9, maxDigits: 9, groupSizes: [2, 3, 2, 2], placeholder: "70 123 45 67" },
  { iso2: "NO", name: "Norway", dialCode: "+47", flag: "🇳🇴", minDigits: 8, maxDigits: 8, groupSizes: [3, 2, 3], placeholder: "412 34 567" },
  { iso2: "DK", name: "Denmark", dialCode: "+45", flag: "🇩🇰", minDigits: 8, maxDigits: 8, groupSizes: [2, 2, 2, 2], placeholder: "20 12 34 56" },
  { iso2: "FI", name: "Finland", dialCode: "+358", flag: "🇫🇮", minDigits: 9, maxDigits: 10, groupSizes: [3, 3, 4], placeholder: "40 123 4567" },
  { iso2: "IE", name: "Ireland", dialCode: "+353", flag: "🇮🇪", minDigits: 9, maxDigits: 9, groupSizes: [2, 3, 4], placeholder: "85 123 4567" },
  { iso2: "PL", name: "Poland", dialCode: "+48", flag: "🇵🇱", minDigits: 9, maxDigits: 9, groupSizes: [3, 3, 3], placeholder: "512 345 678" },
  { iso2: "CZ", name: "Czechia", dialCode: "+420", flag: "🇨🇿", minDigits: 9, maxDigits: 9, groupSizes: [3, 3, 3], placeholder: "601 123 456" },
  { iso2: "RO", name: "Romania", dialCode: "+40", flag: "🇷🇴", minDigits: 9, maxDigits: 9, groupSizes: [3, 3, 3], placeholder: "712 345 678" },
  { iso2: "GR", name: "Greece", dialCode: "+30", flag: "🇬🇷", minDigits: 10, maxDigits: 10, groupSizes: [3, 3, 4], placeholder: "691 234 5678" },
  { iso2: "UA", name: "Ukraine", dialCode: "+380", flag: "🇺🇦", minDigits: 9, maxDigits: 9, groupSizes: [2, 3, 2, 2], placeholder: "50 123 45 67" },
  { iso2: "RU", name: "Russia", dialCode: "+7", flag: "🇷🇺", minDigits: 10, maxDigits: 10, groupSizes: [3, 3, 2, 2], placeholder: "912 345 67 89" },
  { iso2: "IL", name: "Israel", dialCode: "+972", flag: "🇮🇱", minDigits: 9, maxDigits: 9, groupSizes: [2, 3, 4], placeholder: "50 123 4567" },
  { iso2: "EG", name: "Egypt", dialCode: "+20", flag: "🇪🇬", minDigits: 10, maxDigits: 10, groupSizes: [3, 3, 4], placeholder: "100 123 4567" },
  { iso2: "ZA", name: "South Africa", dialCode: "+27", flag: "🇿🇦", minDigits: 9, maxDigits: 9, groupSizes: [2, 3, 4], placeholder: "71 123 4567" },
  { iso2: "NG", name: "Nigeria", dialCode: "+234", flag: "🇳🇬", minDigits: 10, maxDigits: 10, groupSizes: [3, 3, 4], placeholder: "801 234 5678" },
  { iso2: "KE", name: "Kenya", dialCode: "+254", flag: "🇰🇪", minDigits: 9, maxDigits: 9, groupSizes: [3, 3, 3], placeholder: "712 345 678" },
  { iso2: "GH", name: "Ghana", dialCode: "+233", flag: "🇬🇭", minDigits: 9, maxDigits: 9, groupSizes: [3, 3, 3], placeholder: "241 234 567" },
  { iso2: "MA", name: "Morocco", dialCode: "+212", flag: "🇲🇦", minDigits: 9, maxDigits: 9, groupSizes: [2, 3, 2, 2], placeholder: "61 234 56 78" },
  { iso2: "DZ", name: "Algeria", dialCode: "+213", flag: "🇩🇿", minDigits: 9, maxDigits: 9, groupSizes: [2, 3, 2, 2], placeholder: "551 23 45 67" },
  { iso2: "CN", name: "China", dialCode: "+86", flag: "🇨🇳", minDigits: 11, maxDigits: 11, groupSizes: [3, 4, 4], placeholder: "138 1234 5678" },
  { iso2: "JP", name: "Japan", dialCode: "+81", flag: "🇯🇵", minDigits: 10, maxDigits: 10, groupSizes: [2, 4, 4], placeholder: "90 1234 5678" },
  { iso2: "KR", name: "South Korea", dialCode: "+82", flag: "🇰🇷", minDigits: 9, maxDigits: 10, groupSizes: [2, 4, 4], placeholder: "10 1234 5678" },
  { iso2: "SG", name: "Singapore", dialCode: "+65", flag: "🇸🇬", minDigits: 8, maxDigits: 8, groupSizes: [4, 4], placeholder: "8123 4567" },
  { iso2: "MY", name: "Malaysia", dialCode: "+60", flag: "🇲🇾", minDigits: 9, maxDigits: 10, groupSizes: [2, 3, 4], placeholder: "12 345 6789" },
  { iso2: "ID", name: "Indonesia", dialCode: "+62", flag: "🇮🇩", minDigits: 9, maxDigits: 12, groupSizes: [3, 4, 4], placeholder: "812 3456 7890" },
  { iso2: "TH", name: "Thailand", dialCode: "+66", flag: "🇹🇭", minDigits: 9, maxDigits: 9, groupSizes: [2, 3, 4], placeholder: "81 234 5678" },
  { iso2: "VN", name: "Vietnam", dialCode: "+84", flag: "🇻🇳", minDigits: 9, maxDigits: 10, groupSizes: [3, 3, 4], placeholder: "912 345 678" },
  { iso2: "PH", name: "Philippines", dialCode: "+63", flag: "🇵🇭", minDigits: 10, maxDigits: 10, groupSizes: [3, 3, 4], placeholder: "917 123 4567" },
  { iso2: "HK", name: "Hong Kong", dialCode: "+852", flag: "🇭🇰", minDigits: 8, maxDigits: 8, groupSizes: [4, 4], placeholder: "9123 4567" },
  { iso2: "TW", name: "Taiwan", dialCode: "+886", flag: "🇹🇼", minDigits: 9, maxDigits: 9, groupSizes: [2, 3, 4], placeholder: "912 345 678" },
  { iso2: "BR", name: "Brazil", dialCode: "+55", flag: "🇧🇷", minDigits: 10, maxDigits: 11, groupSizes: [2, 5, 4], placeholder: "11 91234 5678" },
  { iso2: "MX", name: "Mexico", dialCode: "+52", flag: "🇲🇽", minDigits: 10, maxDigits: 10, groupSizes: [3, 3, 4], placeholder: "55 1234 5678" },
  { iso2: "AR", name: "Argentina", dialCode: "+54", flag: "🇦🇷", minDigits: 10, maxDigits: 10, groupSizes: [2, 4, 4], placeholder: "11 2345 6789" },
  { iso2: "CL", name: "Chile", dialCode: "+56", flag: "🇨🇱", minDigits: 9, maxDigits: 9, groupSizes: [1, 4, 4], placeholder: "9 1234 5678" },
  { iso2: "CO", name: "Colombia", dialCode: "+57", flag: "🇨🇴", minDigits: 10, maxDigits: 10, groupSizes: [3, 3, 4], placeholder: "300 123 4567" },
  { iso2: "PE", name: "Peru", dialCode: "+51", flag: "🇵🇪", minDigits: 9, maxDigits: 9, groupSizes: [3, 3, 3], placeholder: "987 654 321" },
  { iso2: "VE", name: "Venezuela", dialCode: "+58", flag: "🇻🇪", minDigits: 10, maxDigits: 10, groupSizes: [3, 3, 4], placeholder: "412 123 4567" },
  { iso2: "UY", name: "Uruguay", dialCode: "+598", flag: "🇺🇾", minDigits: 8, maxDigits: 8, groupSizes: [3, 2, 3], placeholder: "99 123 456" },
  { iso2: "CR", name: "Costa Rica", dialCode: "+506", flag: "🇨🇷", minDigits: 8, maxDigits: 8, groupSizes: [4, 4], placeholder: "8312 3456" },
  { iso2: "DO", name: "Dominican Republic", dialCode: "+1", flag: "🇩🇴", minDigits: 10, maxDigits: 10, groupSizes: [3, 3, 4], placeholder: "809 555 0123" },
  { iso2: "JM", name: "Jamaica", dialCode: "+1", flag: "🇯🇲", minDigits: 10, maxDigits: 10, groupSizes: [3, 3, 4], placeholder: "876 555 0123" },
  { iso2: "IS", name: "Iceland", dialCode: "+354", flag: "🇮🇸", minDigits: 7, maxDigits: 7, groupSizes: [3, 2, 2], placeholder: "612 34 56" },
];

export const DEFAULT_COUNTRY = COUNTRIES[0];

export function formatNationalNumber(country: Country, value: string) {
  const digits = value.replace(/\D/g, "").slice(0, country.maxDigits);
  const parts: string[] = [];
  let offset = 0;
  for (const size of country.groupSizes) {
    if (offset >= digits.length) break;
    parts.push(digits.slice(offset, offset + size));
    offset += size;
  }
  if (offset < digits.length) parts.push(digits.slice(offset));
  return parts.join(" ");
}

export function flagUrl(country: Country) {
  return `https://flagcdn.com/w40/${country.iso2.toLowerCase()}.png`;
}