import { useEffect, useRef } from 'react';

const useScrollReveal = (options = {}) => {
  const ref = useRef(null);
  
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-visible');
          if (options.once !== false) {
            observer.unobserve(entry.target);
          }
        } else if (options.once === false) {
          entry.target.classList.remove('reveal-visible');
        }
      },
      {
        threshold: options.threshold || 0.1,
        rootMargin: options.rootMargin || '0px 0px -80px 0px'
      }
    );
    
    observer.observe(element);
    
    return () => {
      if (element) observer.unobserve(element);
    };
  }, [options.threshold, options.rootMargin, options.once]);
  
  return ref;
};

export default useScrollReveal;
