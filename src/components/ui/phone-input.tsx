import * as React from "react";
import { cn } from "@/lib/utils";
import { Phone } from "lucide-react";

export interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
    onChange?: (value: string) => void;
    value?: string;
    placeholder?: string;
    className?: string;
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
    ({ className, onChange, value = "", placeholder = "+90 542 294 0610", ...props }, ref) => {
        const [displayValue, setDisplayValue] = React.useState("+90 ");

        // Telefon numarasını formatla
        const formatPhoneNumber = (numbers: string): string => {
            // Türkiye telefon numarası formatı (+90 542 294 0610)
            if (numbers.length === 0) return "+90 ";
            if (numbers.length <= 3) return `+90 ${numbers}`;
            if (numbers.length <= 6) return `+90 ${numbers.slice(0, 3)} ${numbers.slice(3)}`;
            if (numbers.length <= 9) return `+90 ${numbers.slice(0, 3)} ${numbers.slice(3, 6)} ${numbers.slice(6)}`;
            if (numbers.length <= 10)
                return `+90 ${numbers.slice(0, 3)} ${numbers.slice(3, 6)} ${numbers.slice(6, 9)} ${numbers.slice(9)}`;
            return `+90 ${numbers.slice(0, 3)} ${numbers.slice(3, 6)} ${numbers.slice(6, 9)} ${numbers.slice(9, 10)}`;
        };

        // Input değiştiğinde
        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const input = e.target.value;

            // Eğer input boşsa veya sadece +90 ise
            if (input === "" || input === "+90") {
                setDisplayValue("+90 ");
                onChange?.("");
                return;
            }

            // +90 ile başlamıyorsa, sadece rakamları al ve +90 ekle
            let numbers = "";
            if (input.startsWith("+90")) {
                // +90'dan sonraki kısmı al
                numbers = input.substring(4).replace(/\D/g, "");
            } else {
                // Sadece rakamları al
                numbers = input.replace(/\D/g, "");
            }

            // Formatlanmış değeri göster
            const formatted = formatPhoneNumber(numbers);
            setDisplayValue(formatted);

            // Sadece rakamları parent component'e gönder
            onChange?.(numbers);
        };

        // Value prop'u değiştiğinde display value'yu güncelle
        React.useEffect(() => {
            if (value !== undefined) {
                const formatted = formatPhoneNumber(value);
                setDisplayValue(formatted);
            } else {
                setDisplayValue("+90 ");
            }
        }, [value]);

        return (
            <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                <input
                    type="tel"
                    data-slot="input"
                    className={cn(
                        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                        "focus:border-ring",
                        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
                        "pl-10", // Phone icon için sol padding
                        "font-mono text-sm", // Monospace font ve küçük text için telefon numarası
                        className
                    )}
                    ref={ref}
                    value={displayValue}
                    onChange={handleChange}
                    placeholder={placeholder}
                    maxLength={16} // Formatlanmış maksimum uzunluk (+90 542 294 0610)
                    {...props}
                />
            </div>
        );
    }
);

PhoneInput.displayName = "PhoneInput";

export { PhoneInput };
