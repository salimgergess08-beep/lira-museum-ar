// Small shared helpers: visitor "passport" and the audio guide.

const KEY = 'lira-museum-visited';

function readVisited() {
  try { return new Set(JSON.parse(localStorage.getItem(KEY) || '[]')); } catch { return memory; }
}
const memory = new Set();

export function markVisited(id) {
  const v = readVisited();
  v.add(id); memory.add(id);
  try { localStorage.setItem(KEY, JSON.stringify([...v])); } catch { /* private mode */ }
  return v.size;
}

export function visitedSet() { return readVisited(); }
export function visitedCount() { return readVisited().size; }

let speaking = false;
export function speak(text, button) {
  if (!('speechSynthesis' in window)) { alert('Audio guide is not supported on this browser.'); return; }
  if (speaking) { stopSpeaking(); return; }
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-GB'; u.rate = 0.98;
  const voices = speechSynthesis.getVoices();
  const pick = voices.find((v) => /en-GB/i.test(v.lang) && /female|serena|kate|libby|sonia/i.test(v.name)) || voices.find((v) => /^en/i.test(v.lang));
  if (pick) u.voice = pick;
  speaking = true;
  const label = button ? button.innerHTML : '';
  if (button) button.innerHTML = '&#9632; Stop';
  u.onend = u.onerror = () => { speaking = false; if (button) button.innerHTML = label; };
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
  stopSpeaking.button = button; stopSpeaking.label = label;
}

export function stopSpeaking() {
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  speaking = false;
  if (stopSpeaking.button) stopSpeaking.button.innerHTML = stopSpeaking.label;
}
