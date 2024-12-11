import { HTMLMotionProps } from 'framer-motion';

declare module 'framer-motion' {
  export interface MotionProps extends HTMLMotionProps<"div"> {
    children?: React.ReactNode;
  }

  export interface AnimatePresenceProps {
    children?: React.ReactNode;
  }
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'motion.div': HTMLMotionProps<"div">;
      'motion.button': HTMLMotionProps<"button">;
    }
  }
}
