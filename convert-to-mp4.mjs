import ffmpegPath from 'ffmpeg-static';
import { execFile } from 'child_process';
import path from 'path';

const input = 'C:/Users/User/.gemini/antigravity/brain/2082e158-a11e-4a08-87c8-a332f8f9b469/greekhost-tiktok-demo.webm';
const outputDesktop = 'C:/Users/User/Desktop/GreekHost-TikTok-Demo.mp4';
const outputDownloads = 'C:/Users/User/Downloads/GreekHost-TikTok-Demo.mp4';

console.log('Converting to MP4 using ffmpeg...');

// ffmpeg -i input.webm -c:v libx264 -pix_fmt yuv420p output.mp4
execFile(ffmpegPath, [
  '-y',
  '-i', input,
  '-c:v', 'libx264',
  '-preset', 'fast',
  '-crf', '22',
  '-pix_fmt', 'yuv420p',
  outputDesktop
], (error, stdout, stderr) => {
  if (error) {
    console.error('Error converting to Desktop:', error);
  } else {
    console.log('Successfully saved to Desktop:', outputDesktop);
  }
});

execFile(ffmpegPath, [
  '-y',
  '-i', input,
  '-c:v', 'libx264',
  '-preset', 'fast',
  '-crf', '22',
  '-pix_fmt', 'yuv420p',
  outputDownloads
], (error, stdout, stderr) => {
  if (error) {
    console.error('Error converting to Downloads:', error);
  } else {
    console.log('Successfully saved to Downloads:', outputDownloads);
  }
});
