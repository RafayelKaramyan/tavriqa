import { useRef, type RefObject } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useMotion } from './useMotion';
gsap.registerPlugin(useGSAP, ScrollTrigger);
export function usePageMotion<T extends HTMLElement>(
  dependency: unknown = '',
): RefObject<T | null> {
  const root = useRef<T>(null),
    { reduced } = useMotion();
  useGSAP(
    () => {
      if (reduced || !root.current) return;
      const media = gsap.matchMedia();
      media.add('(prefers-reduced-motion: no-preference)', () => {
        root.current?.querySelectorAll<HTMLElement>('[data-rise]').forEach((element) => {
          gsap.from(element, {
            y: 36,
            duration: 0.85,
            ease: 'power3.out',
            scrollTrigger: { trigger: element, start: 'top 94%', once: true },
          });
        });
        root.current?.querySelectorAll<HTMLElement>('[data-parallax]').forEach((element) => {
          gsap.fromTo(
            element,
            { yPercent: -4, scale: 1.1 },
            {
              yPercent: 4,
              scale: 1.1,
              ease: 'none',
              scrollTrigger: {
                trigger: element.parentElement,
                start: 'top bottom',
                end: 'bottom top',
                scrub: 0.7,
              },
            },
          );
        });
        root.current?.querySelectorAll<HTMLElement>('[data-turn]').forEach((element) => {
          gsap.to(element, {
            rotation: 150,
            ease: 'none',
            scrollTrigger: { trigger: element, start: 'top bottom', end: 'bottom top', scrub: 1 },
          });
        });
      });
      return () => media.revert();
    },
    { scope: root, dependencies: [reduced, dependency], revertOnUpdate: true },
  );
  return root;
}
