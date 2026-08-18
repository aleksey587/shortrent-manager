import ffmpegPath from 'ffmpeg-static';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const videosDir = 'C:/Users/User/.gemini/antigravity/brain/2082e158-a11e-4a08-87c8-a332f8f9b469/videos';
const files = fs.readdirSync(videosDir).filter(f => f.endsWith('.webm'));
if (files.length === 0) {
  console.error('No webm files found');
  process.exit(1);
}

const inputPath = path.join(videosDir, files[0]);
const outputPath = 'C:/Users/User/Desktop/GreekHost-TikTok-Demo.mp4';
const outputDownloads = 'C:/Users/User/Downloads/GreekHost-TikTok-Demo.mp4';

console.log('Converting from:', inputPath);
console.log('To:', outputPath);

const proc = spawn(ffmpegPath, [
  '-y',
  '-i', inputPath,
  '-c:v', 'libx264',
  '-preset', 'fast',
  '-crf', '20',
  '-pix_fmt', 'yuv420p',
  outputPath
], { stdio: 'inherit' });

proc.on('close', code => {
  if (code === 0) {
    console.log('Conversion SUCCESS! File saved to Desktop.');
    fs.copyFileSync(outputPath, outputDownloads);
    console.log('Also copied to Downloads.');
  } else {
    console.error('FFmpeg exited with code:', code);
  }
});
