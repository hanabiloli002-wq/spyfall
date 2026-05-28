import { useEffect, useRef, useState } from 'react';

// Using some generic royalty-free URLs for demo purposes.
// In a real app, these would be local assets or hosted properly.
const SPY_SUSPENSE_URL = 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_55799a4666.mp3?filename=dark-ambient-106518.mp3';
const DEFAULT_AMBIENT_URL = 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3?filename=city-traffic-outdoor-6414.mp3';

export function useAmbientAudio(isSpy, isPlaying, locationName, isSpectator = false) {
  const [isMuted, setIsMuted] = useState(true); // Default to muted so browser doesn't block it
  const audioRef = useRef(null);

  useEffect(() => {
    // Create audio element if it doesn't exist
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.loop = true;
      audioRef.current.volume = 0.3; // Background volume
    }

    const audio = audioRef.current;

    if (isPlaying && !isMuted) {
      if (isSpy || isSpectator) {
        // Spies and spectators hear suspense
        if (audio.src !== SPY_SUSPENSE_URL) {
          audio.src = SPY_SUSPENSE_URL;
        }
      } else {
        // Normal players hear ambient
        if (audio.src !== DEFAULT_AMBIENT_URL) {
          audio.src = DEFAULT_AMBIENT_URL;
        }
      }
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.warn('Audio playback failed (likely browser autoplay policy):', error);
          setIsMuted(true);
        });
      }
    } else {
      audio.pause();
    }

    return () => {
      // Don't destroy audio on unmount, just pause it if we want, but actually we do want to stop it
      // Wait, we only stop it if game is no longer playing. The effect handles playing state.
    };
  }, [isSpy, isPlaying, isMuted, locationName, isSpectator]);

  // Clean up on complete unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return { isMuted, toggleMute };
}
