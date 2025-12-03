import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';
import {
  AnimatePresence,
  motion,
  type Transition,
  type TargetAndTransition,
} from 'framer-motion';
import './RotatingText.css';

type StaggerFrom = 'first' | 'last' | 'center' | 'random' | number;
type SplitBy = 'characters' | 'words' | 'lines' | string;

/**
 * Imperative actions exposed by the rotating text component.
 */
export type RotatingTextHandle = {
  /** Move to the next text in the list. */
  next: () => void;
  /** Move to the previous text in the list. */
  previous: () => void;
  /** Jump to a specific index. */
  jumpTo: (index: number) => void;
  /** Reset to the first text. */
  reset: () => void;
};

/**
 * Props for the animated rotating text component.
 */
type RotatingTextProps = {
  /** Text options to rotate through. */
  texts: string[];
  /** Motion transition applied to each character. */
  transition?: Transition;
  /** Initial target/transition applied to elements. */
  initial?: TargetAndTransition | undefined;
  /** Animate target/transition applied to elements. */
  animate?: TargetAndTransition | undefined;
  /** Exit target/transition applied to elements. */
  exit?: TargetAndTransition | undefined;
  /** AnimatePresence mode. */
  animatePresenceMode?: 'sync' | 'popLayout' | 'wait';
  /** Whether AnimatePresence should render the first state. */
  animatePresenceInitial?: boolean;
  /** Interval (ms) between rotations. */
  rotationInterval?: number;
  /** Delay (s) between characters when staggering. */
  staggerDuration?: number;
  /** Where to start the stagger (first, last, center, etc.). */
  staggerFrom?: StaggerFrom;
  /** Whether to loop once reaching the end. */
  loop?: boolean;
  /** Whether to rotate automatically. */
  auto?: boolean;
  /** Strategy used to split the text (characters, words, lines, or custom). */
  splitBy?: SplitBy;
  /** Callback fired on index change. */
  onNext?: (nextIndex: number) => void;
  /** Class applied to the root span. */
  mainClassName?: string;
  /** Class applied to each word container. */
  splitLevelClassName?: string;
  /** Class applied to each animated element. */
  elementLevelClassName?: string;
};

/**
 * Utility to join conditional class names.
 */
function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Animated text component that cycles through a list of strings, with per-character
 * or per-word animations powered by Framer Motion.
 *
 * @param {RotatingTextProps} props Configuration for the animation and content.
 * @returns {JSX.Element} Animated text span.
 */
const RotatingText = forwardRef<RotatingTextHandle, RotatingTextProps>(
  (props, ref) => {
    const {
      texts,
      transition = { type: 'spring', damping: 25, stiffness: 300 },
      initial = { y: '100%', opacity: 0 },
      animate = { y: 0, opacity: 1 },
      exit = { y: '-120%', opacity: 0 },
      animatePresenceMode = 'wait',
      animatePresenceInitial = false,
      rotationInterval = 2000,
      staggerDuration = 0,
      staggerFrom = 'first',
      loop = true,
      auto = true,
      splitBy = 'characters',
      onNext,
      mainClassName,
      splitLevelClassName,
      elementLevelClassName,
      ...rest
    } = props;

    const [currentTextIndex, setCurrentTextIndex] = useState(0);

    const splitIntoCharacters = useCallback((text: string) => {
      if (typeof Intl !== 'undefined' && (Intl as any).Segmenter) {
        const segmenter = new (Intl as any).Segmenter('en', {
          granularity: 'grapheme',
        });
        return Array.from(segmenter.segment(text), (segment: any) => segment.segment);
      }
      return Array.from(text);
    }, []);

    const elements = useMemo(() => {
      const currentText = texts[currentTextIndex];
      if (splitBy === 'characters') {
        const words = currentText.split(' ');
        return words.map((word, i) => ({
          characters: splitIntoCharacters(word),
          needsSpace: i !== words.length - 1,
        }));
      }
      if (splitBy === 'words') {
        return currentText.split(' ').map((word, i, arr) => ({
          characters: [word],
          needsSpace: i !== arr.length - 1,
        }));
      }
      if (splitBy === 'lines') {
        return currentText.split('\n').map((line, i, arr) => ({
          characters: [line],
          needsSpace: i !== arr.length - 1,
        }));
      }

      return currentText.split(splitBy as string).map((part, i, arr) => ({
        characters: [part],
        needsSpace: i !== arr.length - 1,
      }));
    }, [texts, currentTextIndex, splitBy, splitIntoCharacters]);

    const getStaggerDelay = useCallback(
      (index: number, totalChars: number) => {
        if (staggerFrom === 'first') return index * staggerDuration;
        if (staggerFrom === 'last') return (totalChars - 1 - index) * staggerDuration;
        if (staggerFrom === 'center') {
          const center = Math.floor(totalChars / 2);
          return Math.abs(center - index) * staggerDuration;
        }
        if (staggerFrom === 'random') {
          const randomIndex = Math.floor(Math.random() * totalChars);
          return Math.abs(randomIndex - index) * staggerDuration;
        }
        return Math.abs((staggerFrom as number) - index) * staggerDuration;
      },
      [staggerFrom, staggerDuration]
    );

    const handleIndexChange = useCallback(
      (newIndex: number) => {
        setCurrentTextIndex(newIndex);
        if (onNext) onNext(newIndex);
      },
      [onNext]
    );

    const next = useCallback(() => {
      const nextIndex =
        currentTextIndex === texts.length - 1 ? (loop ? 0 : currentTextIndex) : currentTextIndex + 1;
      if (nextIndex !== currentTextIndex) {
        handleIndexChange(nextIndex);
      }
    }, [currentTextIndex, texts.length, loop, handleIndexChange]);

    const previous = useCallback(() => {
      const prevIndex =
        currentTextIndex === 0 ? (loop ? texts.length - 1 : currentTextIndex) : currentTextIndex - 1;
      if (prevIndex !== currentTextIndex) {
        handleIndexChange(prevIndex);
      }
    }, [currentTextIndex, texts.length, loop, handleIndexChange]);

    const jumpTo = useCallback(
      (index: number) => {
        const validIndex = Math.max(0, Math.min(index, texts.length - 1));
        if (validIndex !== currentTextIndex) {
          handleIndexChange(validIndex);
        }
      },
      [texts.length, currentTextIndex, handleIndexChange]
    );

    const reset = useCallback(() => {
      if (currentTextIndex !== 0) {
        handleIndexChange(0);
      }
    }, [currentTextIndex, handleIndexChange]);

    useImperativeHandle(
      ref,
      () => ({
        next,
        previous,
        jumpTo,
        reset,
      }),
      [next, previous, jumpTo, reset]
    );

    useEffect(() => {
      if (!auto) return;
      const intervalId = window.setInterval(next, rotationInterval);
      return () => window.clearInterval(intervalId);
    }, [next, rotationInterval, auto]);

    return (
      <motion.span className={cn('text-rotate', mainClassName)} {...rest} transition={transition}>
        <span className="text-rotate-sr-only">{texts[currentTextIndex]}</span>
        <AnimatePresence mode={animatePresenceMode} initial={animatePresenceInitial}>
          <motion.span
            key={currentTextIndex}
            className={cn(splitBy === 'lines' ? 'text-rotate-lines' : 'text-rotate')}
            aria-hidden="true"
          >
            {elements.map((wordObj, wordIndex, array) => {
              const previousCharsCount = array
                .slice(0, wordIndex)
                .reduce((sum, word) => sum + word.characters.length, 0);
              const totalChars = array.reduce((sum, word) => sum + word.characters.length, 0);

              return (
                <span key={wordIndex} className={cn('text-rotate-word', splitLevelClassName)}>
                  {wordObj.characters.map((char, charIndex) => (
                    <motion.span
                      key={charIndex}
                      initial={initial}
                      animate={animate}
                      exit={exit}
                      transition={{
                        ...transition,
                        delay: getStaggerDelay(previousCharsCount + charIndex, totalChars),
                      }}
                      className={cn('text-rotate-element', elementLevelClassName)}
                    >
                      {char}
                    </motion.span>
                  ))}
                  {wordObj.needsSpace && <span className="text-rotate-space"> </span>}
                </span>
              );
            })}
          </motion.span>
        </AnimatePresence>
      </motion.span>
    );
  }
);

RotatingText.displayName = 'RotatingText';

export default RotatingText;
