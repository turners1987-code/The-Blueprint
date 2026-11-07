#!/usr/bin/env python
"""Render lesson narration (Kokoro-82M, bf_emma) with a low music bed.

Usage (run with the Kokoro venv's Python, outside the repo):
  C:\kokoro-venv\Scripts\python.exe scripts/render-narration.py <lesson.json> <music-pool-folder>

The folder holds the soundtrack tracks listed in POOL and ENDING. One main
track per module (module number mod the pool size), the same beat under every
segment of that module except the last, which gets the ENDING track. The track used is
written to each segment as "music" (title, producer, url) for the credits on
ai.html. The pool folder is never copied into the repo.

Per segment: synthesize each cue once, join with 0.35 s gaps, then export two
stems from that one run, with identical encoder settings (mono, 24 kHz, 64 kbps):
  assets/audio/<NN>/<id>.mp3        voice + music, music at -12 dB (fade in 1.5 s,
                                    out 2 s, looped to the segment length)
  assets/audio/<NN>/<id>.voice.mp3  voice only
The player blends them (mix gain g, voice gain 1-g) so the voice never changes
and the music sits at g x -12 dB (default g 0.5 = -18 dB). Cue starts and the
segment duration are then written back into the lesson JSON. The music file is
never copied into the repo, and no music-only file is ever written.

After a render, run these from the repo root so the slides, credits and cache
follow the new timings:
  node scripts/build-lesson-slides.mjs <NN>   # reveal delays match the new cue starts
  node scripts/build-credits.mjs              # rewrites the "Lesson music" lines on ai.html
and bump CACHE_VERSION in sw.js.
"""
import hashlib
import json, math, os, shutil, subprocess, sys, tempfile
import numpy as np, soundfile as sf
from kokoro import KPipeline

SR, GAP, VOICE, MUSIC_DB = 24000, 0.35, 'bf_emma', -12
FADE_IN, FADE_OUT = 1.5, 2.0

# The course soundtrack, picked by ear by Shane (Nov 6). Pixabay Content License.
# (file, title, producer, page). One main track per module (module number mod
# the pool size), the same beat under every segment of that module. ENDING is
# used sparingly: only under a module's last narrated segment.
POOL = [
    ('vaitsez-rap-rap-beat-beats-music-486586.mp3', 'Rap - Rap Beat Beats Music', 'vaitsez', 'https://pixabay.com/music/trap-rap-rap-beat-beats-music-486586/'),
    ('pietix-cinematic-coup-scene-1-bass-525683.mp3', 'Cinematic coup scene 1 bass', 'pietiX', 'https://pixabay.com/music/instrumental-cinematic-coup-scene-1-bass-525683/'),
    ('vaitsez-vlog-vlog-beat-620108.mp3', 'Vlog - Vlog Beat', 'vaitsez', 'https://pixabay.com/music/trap-vlog-vlog-beat-620108/'),
    ('gr0za-rap-rap-beat-beats-557557.mp3', 'Rap - Rap Beat Beats', 'GR0ZA', 'https://pixabay.com/music/lofi-rap-rap-beat-beats-557557/'),
]
ENDING = ('kontraa-wega-old-school-hiphop-music-422621.mp3', 'Wega | Old School Hiphop Music', 'kontraa', 'https://pixabay.com/music/beats-wega-old-school-hiphop-music-422621/')

def main(lesson_path, pool_dir):
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    lesson_path = os.path.abspath(lesson_path)
    raw = open(lesson_path, encoding='utf-8', newline='').read()
    d = json.loads(raw)
    nn = d['module'].split('-')[0]
    outdir = os.path.join(root, 'assets', 'audio', nn)
    os.makedirs(outdir, exist_ok=True)
    pipe = KPipeline(lang_code='b')
    gap = np.zeros(int(GAP * SR), dtype=np.float32)
    tmp = tempfile.mkdtemp()
    narrated = [s for s in d['segments'] if s.get('cues')]
    for k, s in enumerate(narrated):
        fname, mtitle, producer, page = ENDING if s is narrated[-1] else POOL[int(nn) % len(POOL)]
        music = os.path.join(pool_dir, fname)
        if s.get('no_music'):
            music = None  # a quiet segment: voice only; the mix stem is a copy of the voice stem
            s.pop('music', None)
        elif not os.path.isfile(music):
            sys.exit(f'missing track in pool folder: {fname}')
        else:
            s['music'] = {'title': mtitle, 'producer': producer, 'url': page}
        speed = float(s.get('speed', 1.0))  # 0.92 reads slower and warmer; 1.0 is the default
        parts, starts, pos = [], [], 0
        for i, c in enumerate(s['cues']):
            a = np.concatenate([np.asarray(x[2], dtype=np.float32)
                                for x in pipe(c['text'], voice=VOICE, speed=speed)])
            if i:
                parts.append(gap); pos += len(gap)
            starts.append(round(pos / SR, 1))
            parts.append(a); pos += len(a)
        voice = np.concatenate(parts)
        length = len(voice) / SR
        wav = os.path.join(tmp, s['id'] + '.wav')
        sf.write(wav, voice, SR)
        out = os.path.join(outdir, s['id'] + '.mp3')
        vout = os.path.join(outdir, s['id'] + '.voice.mp3')
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav, '-ac', '1',
                        '-ar', str(SR), '-b:a', '64k', vout], check=True)
        fo = max(0, length - FADE_OUT)
        flt = (f'[1:a]aresample={SR},aformat=channel_layouts=mono,atrim=0:{length:.3f},'
               f'volume={MUSIC_DB}dB,afade=t=in:d={FADE_IN},afade=t=out:st={fo:.3f}:d={FADE_OUT}[m];'
               f'[0:a]aformat=channel_layouts=mono[v];'
               f'[v][m]amix=inputs=2:duration=first:normalize=0[o]')
        if music is None:
            shutil.copyfile(vout, out)
        else:
            subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav,
                            '-stream_loop', '-1', '-i', music, '-filter_complex', flt,
                            '-map', '[o]', '-ac', '1', '-ar', str(SR), '-b:a', '64k', out], check=True)
        # re-time: slides keep the cue they start on now
        old = [c['start'] for c in s['cues']]
        for sl in s.get('slides', []):
            sl['start'] = starts[old.index(sl['start'])]
        for c, t in zip(s['cues'], starts):
            c['start'] = t
        s['duration'] = math.ceil(length * 10) / 10
        # cache-busting version: browsers may keep an audio URL for hours
        h = hashlib.sha256(open(out, 'rb').read() + open(vout, 'rb').read()).hexdigest()
        s['audio_v'] = h[:10]
        print(s['id'], f'{length:.2f}s', fname, starts, flush=True)
    nl = '\n'
    open(lesson_path, 'w', encoding='utf-8', newline='').write(
        json.dumps(d, indent=2, ensure_ascii=False) + (nl if raw.endswith(nl) else ''))

if __name__ == '__main__':
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
