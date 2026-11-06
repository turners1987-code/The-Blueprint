#!/usr/bin/env python
"""Render lesson narration (Kokoro-82M, bf_emma) with a low music bed.

Usage (run with the Kokoro venv's Python, outside the repo):
  C:\kokoro-venv\Scripts\python.exe scripts/render-narration.py <lesson.json> <music-pool-folder>

The folder holds the soundtrack tracks listed in POOL. One track per module
(module number mod the pool size), the same beat under every segment of that
module, so neighbouring modules sound different. The track used is
written to each segment as "music" (title, producer, url) for the credits on
ai.html. The pool folder is never copied into the repo.

Per segment: synthesize each cue once, join with 0.35 s gaps, then export two
stems from that one run, with identical encoder settings (mono, 24 kHz, 96 kbps):
  assets/audio/<NN>/<id>.mp3        voice + music, music at -12 dB (fade in 1.5 s,
                                    out 2 s, looped to the segment length)
  assets/audio/<NN>/<id>.voice.mp3  voice only
The player blends them (mix gain g, voice gain 1-g) so the voice never changes
and the music sits at g x -12 dB (default g 0.5 = -18 dB). Cue starts and the
segment duration are then written back into the lesson JSON. The music file is
never copied into the repo, and no music-only file is ever written.
"""
import hashlib
import json, math, os, subprocess, sys, tempfile
import numpy as np, soundfile as sf
from kokoro import KPipeline

SR, GAP, VOICE, MUSIC_DB = 24000, 0.35, 'bf_emma', -12
FADE_IN, FADE_OUT = 1.5, 2.0

# (file, title, producer, page). One track per module: module number mod the
# pool size. Add tracks here as Shane approves them (reference/research/
# music-candidates.md, "Soundtrack"). Pixabay Content License.
POOL = [
    ('vaitsez-rap-rap-beat-beats-music-486586.mp3', 'Rap - Rap Beat Beats Music', 'vaitsez', 'https://pixabay.com/music/trap-rap-rap-beat-beats-music-486586/'),
]

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
    for k, s in enumerate(d['segments']):
        if not s.get('cues'):
            continue
        fname, mtitle, producer, page = POOL[int(nn) % len(POOL)]
        music = os.path.join(pool_dir, fname)
        if not os.path.isfile(music):
            sys.exit(f'missing track in pool folder: {fname}')
        s['music'] = {'title': mtitle, 'producer': producer, 'url': page}
        parts, starts, pos = [], [], 0
        for i, c in enumerate(s['cues']):
            a = np.concatenate([np.asarray(x[2], dtype=np.float32)
                                for x in pipe(c['text'], voice=VOICE, speed=1.0)])
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
                        '-ar', str(SR), '-b:a', '96k', vout], check=True)
        fo = max(0, length - FADE_OUT)
        flt = (f'[1:a]aresample={SR},aformat=channel_layouts=mono,atrim=0:{length:.3f},'
               f'volume={MUSIC_DB}dB,afade=t=in:d={FADE_IN},afade=t=out:st={fo:.3f}:d={FADE_OUT}[m];'
               f'[0:a]aformat=channel_layouts=mono[v];'
               f'[v][m]amix=inputs=2:duration=first:normalize=0[o]')
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav,
                        '-stream_loop', '-1', '-i', music, '-filter_complex', flt,
                        '-map', '[o]', '-ac', '1', '-ar', str(SR), '-b:a', '96k', out], check=True)
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
