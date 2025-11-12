import React from 'react';
import useScrollReveal from '../../hooks/useScrollReveal';
import './AnimatedSection.css';

const AnimatedSection = ({ 
  children, 
  delay = 0, 
  className = '',
  animation = 'fade-up' // fade-up, fade-in, slide-left, slide-right, scale
}) => {
  const ref = useScrollReveal({ once: true, threshold: 0.1 });

  const animationClass = `animated-${animation}`;
  const delayClass = delay > 0 ? `animated-delay-${Math.min(delay, 5)}` : '';

  return (
    <div 
      ref={ref} 
      className={`animated-section ${animationClass} ${delayClass} ${className}`}
    >
      {children}
    </div>
  );
};

export default AnimatedSection;
