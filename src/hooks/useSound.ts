'use client';

import { useCallback } from 'react';

type SoundType = 'success' | 'error' | 'attention' | 'complete';

const SOUNDS: Record<SoundType, string> = {
  // Simple beep tones using Web Audio API
  success: 'beep:1000:200',  // 1000Hz for 200ms
  error: 'beep:400:400',     // 400Hz for 400ms
  attention: 'beep:800:150', // 800Hz for 150ms (3 times)
  complete: 'beep:1200:100', // 1200Hz short beep
};

export function useSound() {
  const playBeep = useCallback((frequency: number, duration: number) => {
    if (typeof window === 'undefined') return;

    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration / 1000);
  }, []);

  const play = useCallback((type: SoundType) => {
    const sound = SOUNDS[type];

    if (sound.startsWith('beep:')) {
      const [, freq, duration] = sound.split(':');
      const frequency = parseInt(freq, 10);
      const dur = parseInt(duration, 10);

      if (type === 'attention') {
        // Play 3 beeps for attention
        playBeep(frequency, dur);
        setTimeout(() => playBeep(frequency, dur), 200);
        setTimeout(() => playBeep(frequency, dur), 400);
      } else {
        playBeep(frequency, dur);
      }
    }
  }, [playBeep]);

  const success = useCallback(() => play('success'), [play]);
  const error = useCallback(() => play('error'), [play]);
  const attention = useCallback(() => play('attention'), [play]);
  const complete = useCallback(() => play('complete'), [play]);

  return { play, success, error, attention, complete };
}