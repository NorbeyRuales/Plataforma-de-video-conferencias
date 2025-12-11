import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState, } from 'react';
import { AnimatePresence, motion, } from 'framer-motion';
import './RotatingText.css';
function cn(...classes) {
    return classes.filter(Boolean).join(' ');
}
/**
 * Animated text rotator that cycles through provided strings with staggered motion.
 *
 * @param {RotatingTextProps} props Configuration for rotation, timing, and splitting.
 * @returns {JSX.Element} Animated wrapper that shows one text at a time.
 */
const RotatingText = forwardRef((props, ref) => {
    const { texts, transition = { type: 'spring', damping: 25, stiffness: 300 }, initial = { y: '100%', opacity: 0 }, animate = { y: 0, opacity: 1 }, exit = { y: '-120%', opacity: 0 }, animatePresenceMode = 'wait', animatePresenceInitial = false, rotationInterval = 2000, staggerDuration = 0, staggerFrom = 'first', loop = true, auto = true, splitBy = 'characters', onNext, mainClassName, splitLevelClassName, elementLevelClassName, ...rest } = props;
    const [currentTextIndex, setCurrentTextIndex] = useState(0);
    const splitIntoCharacters = useCallback((text) => {
        if (typeof Intl !== 'undefined' && Intl.Segmenter) {
            const segmenter = new Intl.Segmenter('en', {
                granularity: 'grapheme',
            });
            return Array.from(segmenter.segment(text), (segment) => segment.segment);
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
        return currentText.split(splitBy).map((part, i, arr) => ({
            characters: [part],
            needsSpace: i !== arr.length - 1,
        }));
    }, [texts, currentTextIndex, splitBy, splitIntoCharacters]);
    const getStaggerDelay = useCallback((index, totalChars) => {
        if (staggerFrom === 'first')
            return index * staggerDuration;
        if (staggerFrom === 'last')
            return (totalChars - 1 - index) * staggerDuration;
        if (staggerFrom === 'center') {
            const center = Math.floor(totalChars / 2);
            return Math.abs(center - index) * staggerDuration;
        }
        if (staggerFrom === 'random') {
            const randomIndex = Math.floor(Math.random() * totalChars);
            return Math.abs(randomIndex - index) * staggerDuration;
        }
        return Math.abs(staggerFrom - index) * staggerDuration;
    }, [staggerFrom, staggerDuration]);
    const handleIndexChange = useCallback((newIndex) => {
        setCurrentTextIndex(newIndex);
        if (onNext)
            onNext(newIndex);
    }, [onNext]);
    const next = useCallback(() => {
        const nextIndex = currentTextIndex === texts.length - 1 ? (loop ? 0 : currentTextIndex) : currentTextIndex + 1;
        if (nextIndex !== currentTextIndex) {
            handleIndexChange(nextIndex);
        }
    }, [currentTextIndex, texts.length, loop, handleIndexChange]);
    const previous = useCallback(() => {
        const prevIndex = currentTextIndex === 0 ? (loop ? texts.length - 1 : currentTextIndex) : currentTextIndex - 1;
        if (prevIndex !== currentTextIndex) {
            handleIndexChange(prevIndex);
        }
    }, [currentTextIndex, texts.length, loop, handleIndexChange]);
    const jumpTo = useCallback((index) => {
        const validIndex = Math.max(0, Math.min(index, texts.length - 1));
        if (validIndex !== currentTextIndex) {
            handleIndexChange(validIndex);
        }
    }, [texts.length, currentTextIndex, handleIndexChange]);
    const reset = useCallback(() => {
        if (currentTextIndex !== 0) {
            handleIndexChange(0);
        }
    }, [currentTextIndex, handleIndexChange]);
    useImperativeHandle(ref, () => ({
        next,
        previous,
        jumpTo,
        reset,
    }), [next, previous, jumpTo, reset]);
    useEffect(() => {
        if (!auto)
            return;
        const intervalId = window.setInterval(next, rotationInterval);
        return () => window.clearInterval(intervalId);
    }, [next, rotationInterval, auto]);
    return (_jsxs(motion.span, { className: cn('text-rotate', mainClassName), ...rest, transition: transition, children: [_jsx("span", { className: "text-rotate-sr-only", children: texts[currentTextIndex] }), _jsx(AnimatePresence, { mode: animatePresenceMode, initial: animatePresenceInitial, children: _jsx(motion.span, { className: cn(splitBy === 'lines' ? 'text-rotate-lines' : 'text-rotate'), "aria-hidden": "true", children: elements.map((wordObj, wordIndex, array) => {
                        const previousCharsCount = array
                            .slice(0, wordIndex)
                            .reduce((sum, word) => sum + word.characters.length, 0);
                        const totalChars = array.reduce((sum, word) => sum + word.characters.length, 0);
                        return (_jsxs("span", { className: cn('text-rotate-word', splitLevelClassName), children: [wordObj.characters.map((char, charIndex) => (_jsx(motion.span, { initial: initial, animate: animate, exit: exit, transition: {
                                        ...transition,
                                        delay: getStaggerDelay(previousCharsCount + charIndex, totalChars),
                                    }, className: cn('text-rotate-element', elementLevelClassName), children: char }, charIndex))), wordObj.needsSpace && _jsx("span", { className: "text-rotate-space", children: " " })] }, wordIndex));
                    }) }, currentTextIndex) })] }));
});
RotatingText.displayName = 'RotatingText';
export default RotatingText;
