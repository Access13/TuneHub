import { Track } from '../types';

interface LyricLine {
  time: number;
  text: string;
}

export const getLyrics = async (track: Track): Promise<LyricLine[]> => {
  // In a real app, fetch from an API like Musixmatch or Genius
  // For now, we'll generate some generic synced lyrics based on the track title
  const lines: LyricLine[] = [
    { time: 0, text: `[Instrumental Intro]` },
    { time: 5, text: `Listening to ${track.title}` },
    { time: 10, text: `By the amazing ${track.artist}` },
    { time: 15, text: `This vibe is just right` },
    { time: 20, text: `TuneHub bringing the heat` },
    { time: 25, text: `[Chorus]` },
    { time: 30, text: `Feel the rhythm, feel the flow` },
    { time: 35, text: `Everywhere you want to go` },
    { time: 40, text: `Music in your soul tonight` },
    { time: 45, text: `Everything will be alright` },
    { time: 50, text: `[Verse 2]` },
    { time: 55, text: `Walking down the neon street` },
    { time: 60, text: `Moving to the steady beat` },
    { time: 65, text: `Colors dancing in the air` },
    { time: 70, text: `Music playing everywhere` },
    { time: 75, text: `[Chorus]` },
    { time: 80, text: `Feel the rhythm, feel the flow` },
    { time: 85, text: `Everywhere you want to go` },
    { time: 90, text: `Music in your soul tonight` },
    { time: 95, text: `Everything will be alright` },
    { time: 100, text: `[Outro]` },
    { time: 105, text: `TuneHub...` },
    { time: 110, text: `Atmospheric Audio...` },
    { time: 115, text: `[Fade out]` },
  ];

  return lines;
};
