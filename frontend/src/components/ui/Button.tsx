import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'default', ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-lg font-heading font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 cursor-pointer';
    
    const variants = {
      default: 'gradient-primary text-white hover:shadow-glow-primary hover:scale-105 hover:-translate-y-0.5',
      outline: 'border-2 border-primary/30 bg-white/80 backdrop-blur-sm text-primary hover:bg-primary hover:text-white hover:border-primary hover:shadow-lg',
      ghost: 'hover:bg-primary/10 hover:text-primary text-foreground',
    };
    
    const sizes = {
      default: 'h-11 px-6 py-2.5 text-sm',
      sm: 'h-9 rounded-md px-4 text-xs',
      lg: 'h-12 rounded-lg px-8 text-base',
    };
    
    return (
      <button
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export default Button;

