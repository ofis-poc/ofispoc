import * as React from "react"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center rounded-xl font-medium transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:scale-98 duration-100";
    
    const variants = {
      primary: "bg-[#2E7D32] text-white shadow-xs hover:bg-[#1B5E20] dark:bg-[#2E7D32] dark:hover:bg-[#388E3C]",
      secondary: "bg-[#E8F5E9] text-[#2E7D32] hover:bg-[#C8E6C9] dark:bg-emerald-950/40 dark:text-emerald-400 dark:hover:bg-emerald-950/80",
      outline: "border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900",
      ghost: "hover:bg-zinc-100 text-zinc-700 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50",
      danger: "bg-red-600 text-white shadow-xs hover:bg-red-700 dark:bg-red-900 dark:hover:bg-red-800",
    };

    const sizes = {
      sm: "h-9 px-3.5 text-sm",
      md: "h-10 px-5 text-sm",
      lg: "h-11 px-7 text-base",
      icon: "h-10 w-10 p-0",
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className || ""}`}
        {...props}
      />
    );
  }
)
Button.displayName = "Button"

export { Button }
