import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import './ImageSlider.css';

const wrapIndex = (index, length) => {
  if (length <= 0) return 0;
  return ((index % length) + length) % length;
};

const ImageSlider = ({
  slides,
  autoPlay = true,
  intervalMs = 5500,
  pauseOnHover = true,
  transitionStyle = 'slide',
  showProgress = false,
  className = '',
  ariaLabel = 'Galerie d’images'
}) => {
  const safeSlides = useMemo(() => (Array.isArray(slides) ? slides.filter(Boolean) : []), [slides]);
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const pausedRef = useRef(false);

  const length = safeSlides.length;
  const activeIndex = wrapIndex(index, length);

  const goTo = (nextIndex) => {
    if (!length) return;
    const normalizedNext = wrapIndex(nextIndex, length);
    const normalizedCurrent = wrapIndex(index, length);
    setDirection(normalizedNext > normalizedCurrent ? 1 : -1);
    setIndex(normalizedNext);
  };

  const next = () => {
    if (!length) return;
    setDirection(1);
    setIndex((prev) => prev + 1);
  };

  const prev = () => {
    if (!length) return;
    setDirection(-1);
    setIndex((prev) => prev - 1);
  };

  useEffect(() => {
    if (!autoPlay || !length) return;
    const id = setInterval(() => {
      if (!pausedRef.current) next();
    }, intervalMs);
    return () => clearInterval(id);
  }, [autoPlay, intervalMs, length]);

  const variants =
    transitionStyle === 'cinema'
      ? {
          enter: () => ({ opacity: 0, scale: 1.03 }),
          center: { opacity: 1, scale: 1 },
          exit: () => ({ opacity: 0, scale: 0.995 })
        }
      : {
          enter: (dir) => ({ x: dir > 0 ? 40 : -40, opacity: 0, scale: 0.98 }),
          center: { x: 0, opacity: 1, scale: 1 },
          exit: (dir) => ({ x: dir > 0 ? -40 : 40, opacity: 0, scale: 0.98 })
        };

  const active = safeSlides[activeIndex];
  const progressEnabled = Boolean(showProgress && autoPlay && length > 1);

  return (
    <div
      className={`image-slider ${className}`}
      onMouseEnter={() => {
        if (pauseOnHover) pausedRef.current = true;
      }}
      onMouseLeave={() => {
        if (pauseOnHover) pausedRef.current = false;
      }}
      aria-label={ariaLabel}
    >
      <div className="image-slider__stage">
        <button type="button" className="image-slider__nav image-slider__nav--prev" onClick={prev} aria-label="Image précédente">
          ‹
        </button>

        <div className="image-slider__frame">
          {progressEnabled && (
            <div className="image-slider__progress" aria-hidden="true">
              <motion.div
                key={`p-${activeIndex}`}
                className="image-slider__progress-bar"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: intervalMs / 1000, ease: 'linear' }}
              />
            </div>
          )}
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            {active && (
              <motion.figure
                key={active.src}
                className="image-slider__figure"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={
                  transitionStyle === 'cinema'
                    ? { duration: 0.55, ease: [0.22, 1, 0.36, 1] }
                    : { duration: 0.45, ease: [0.22, 1, 0.36, 1] }
                }
              >
                <img className="image-slider__img" src={active.src} alt={active.alt || ''} loading="lazy" />
                {(active.title || active.description) && (
                  <figcaption className="image-slider__caption">
                    {active.title && <div className="image-slider__title">{active.title}</div>}
                    {active.description && <div className="image-slider__desc">{active.description}</div>}
                  </figcaption>
                )}
              </motion.figure>
            )}
          </AnimatePresence>
        </div>

        <button type="button" className="image-slider__nav image-slider__nav--next" onClick={next} aria-label="Image suivante">
          ›
        </button>
      </div>

      {length > 1 && (
        <div className="image-slider__dots" role="tablist" aria-label="Navigation de la galerie">
          {safeSlides.map((s, i) => {
            const isActive = wrapIndex(index, length) === i;
            return (
              <button
                key={`${s.src}-${i}`}
                type="button"
                className={`image-slider__dot ${isActive ? 'is-active' : ''}`}
                onClick={() => goTo(i)}
                aria-label={`Aller à l’image ${i + 1}`}
                aria-current={isActive ? 'true' : 'false'}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ImageSlider;
