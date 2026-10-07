import { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';

let initialized = false;
export default function useAnimations(root, dependencies) {
  useEffect(() => {
    if (!initialized) {
      AOS.init({ duration: 350, easing: 'ease-out', once: true, offset: 0, disableMutationObserver: true });
      initialized = true;
    }
    let frame;
    const refresh = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => AOS.refreshHard());
    };
    const observer = new MutationObserver(refresh);
    const resize = new ResizeObserver(refresh);
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (root.current) {
      observer.observe(root.current, { childList: true, subtree: true });
      resize.observe(root.current);
    }
    motion.addEventListener('change', refresh);
    refresh();
    return () => { observer.disconnect(); resize.disconnect(); motion.removeEventListener('change', refresh); cancelAnimationFrame(frame); };
  }, [root]);
  useEffect(() => {
    const frame = requestAnimationFrame(() => AOS.refreshHard());
    return () => cancelAnimationFrame(frame);
  }, dependencies);
}
