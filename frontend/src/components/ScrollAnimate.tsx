import { ReactNode, useEffect, useRef, useState } from 'react';

interface ScrollAnimateProps {
  children: ReactNode;
  animation?: 'fade-in' | 'slide-left' | 'slide-right' | 'scale' | 'rotate';
  delay?: number;
  threshold?: number;
  className?: string;
}

export default function ScrollAnimate({
  children,
  animation = 'fade-in',
  delay = 0,
  threshold = 0.1,
  className = '',
}: ScrollAnimateProps) {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            setIsVisible(true);
          }, delay);
          observer.unobserve(element);
        }
      },
      {
        threshold,
        rootMargin: '0px 0px -50px 0px',
      }
    );

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [delay, threshold]);

  return (
    <div
      ref={elementRef}
      className={`scroll-${animation} ${isVisible ? 'visible' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

