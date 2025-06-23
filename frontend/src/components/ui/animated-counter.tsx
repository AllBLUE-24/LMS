// src/components/ui/animated-counter.tsx

"use client";

import { useEffect, useState } from "react";
import { motion, useSpring } from "framer-motion";

export function AnimatedCounter({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  useEffect(() => {
    const unsubscribe = spring.on("change", (latest) => {
      setDisplayValue(Math.round(latest));
    });
    return unsubscribe;
  }, [spring]);

  return <motion.span>{displayValue.toLocaleString()}</motion.span>;
}