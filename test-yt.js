import { YoutubeTranscript } from 'youtube-transcript';

async function testExtraction() {
  const testUrls = [
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://www.youtube.com/watch?v=kXYiU_JCYtU',
    'https://youtu.be/3JZ_D3ELwOQ'
  ];

  for (const url of testUrls) {
    console.log(`\nTesting: ${url}`);
    try {
      const transcript = await YoutubeTranscript.fetchTranscript(url);
      console.log(`✓ Successfully extracted ${transcript.length} caption items!`);
      console.log('Sample snippet:', transcript.slice(0, 3));
    } catch (err) {
      console.log('youtube-transcript error:', err.message);
    }
  }
}

testExtraction();
