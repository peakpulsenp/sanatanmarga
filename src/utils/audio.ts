// Temple bell (Ghanta) synthesized audio utility using Web Audio API

let hasUserInteracted = false;
if (typeof window !== "undefined") {
  const markInteracted = () => {
    hasUserInteracted = true;
    window.removeEventListener("click", markInteracted);
    window.removeEventListener("keydown", markInteracted);
    window.removeEventListener("touchstart", markInteracted);
  };
  window.addEventListener("click", markInteracted, { passive: true });
  window.addEventListener("keydown", markInteracted, { passive: true });
  window.addEventListener("touchstart", markInteracted, { passive: true });
}

export function playTempleBellSound(force: boolean = false) {
  try {
    if (!hasUserInteracted && !force) {
      return;
    }
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Resume context if suspended (browser autoplay policies)
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    // Bell frequencies (fundamental and metallic harmonics for rich temple bell resonance)
    const frequencies = [480, 820, 1120, 1650, 2350, 3100];
    const gains = [0.7, 0.45, 0.3, 0.2, 0.12, 0.08];
    const decays = [4.0, 3.2, 2.5, 1.8, 1.2, 0.8];

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.8, ctx.currentTime);
    masterGain.connect(ctx.destination);

    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Sine for fundamental warmth, triangle for metallic shimmer
      osc.type = i === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      // Slight frequency drop over time for realistic bell pitch bend
      osc.frequency.exponentialRampToValueAtTime(freq * 0.98, ctx.currentTime + decays[i]);

      gain.gain.setValueAtTime(gains[i], ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + decays[i]);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start();
      osc.stop(ctx.currentTime + decays[i]);
    });
  } catch (err) {
    console.error("Temple bell audio playback error:", err);
  }
}
