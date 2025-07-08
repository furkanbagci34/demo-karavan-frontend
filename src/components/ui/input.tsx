import * as React from "react";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "./button";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    type?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    if (type === "password") {
        return (
            <div className="relative">
                <input
                    type={showPassword ? "text" : "password"}
                    data-slot="input"
                    className={cn(
                        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                        "focus:border-ring",
                        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
                        "pr-10",
                        className
                    )}
                    ref={ref}
                    {...props}
                />
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-1 hover:bg-transparent"
                    onClick={togglePasswordVisibility}
                    tabIndex={-1}
                >
                    {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    )}
                    <span className="sr-only">{showPassword ? "Şifreyi gizle" : "Şifreyi göster"}</span>
                </Button>
            </div>
        );
    }

    return (
        <input
            type={type}
            data-slot="input"
            className={cn(
                "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                "focus:border-ring",
                "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
                className
            )}
            ref={ref}
            {...props}
        />
    );
});

Input.displayName = "Input";

export { Input };
