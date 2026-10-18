import { createContext, useContext } from 'react';
export const MotionContext = createContext({
  reduced: false,
  systemReduced: false,
  toggle: () => {},
});
export const useMotion = () => useContext(MotionContext);
