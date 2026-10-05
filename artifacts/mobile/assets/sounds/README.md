# Bundled workout timer chime

`bell.wav` is the original generated chime bundled with the current timer. See `LICENSE.txt`. No third-party recording or download is required. Microphone permission is blocked; Android's normal `MODIFY_AUDIO_SETTINGS` permission is retained for Expo AV playback routing. Verify audible playback on a real release-installed device.

The earlier asset plan below is historical; `bell.mp3` is not required by the current component.

## Earlier asset plan

This directory should contain the following audio files:

## Required Files

- `bell.mp3` - Boxing bell sound (played at start/end of rounds and rest periods)
  - Duration: ~1-2 seconds
  - Format: MP3
  - Recommended: A clear boxing bell ding

## Optional Files (for future enhancement)

- `countdown-10.mp3` - Voice saying "10"
- `countdown-5.mp3` - Voice saying "5"
- `countdown-3.mp3` - Voice saying "3"
- `countdown-2.mp3` - Voice saying "2"
- `countdown-1.mp3` - Voice saying "1"

## Sources

You can find free boxing bell sounds at:
- Freesound.org (search "boxing bell")
- Zapsplat.com
- Or record your own

## Note

For now, the app uses haptic feedback for countdowns even without voice files.
The bell sound is required for the full experience.
