const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomChars(length) {
  let output = '';

  for (let i = 0; i < length; i += 1) {
    const index = Math.floor(Math.random() * CODE_CHARS.length);
    output += CODE_CHARS[index];
  }

  return output;
}

function subjectPrefix(subject) {
  const normalized = String(subject || '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 3);

  return normalized;
}

function generateRoomCode(subject) {
  const prefix = subjectPrefix(subject);
  const randomPartLength = Math.max(3, 6 - prefix.length);
  const randomPart = randomChars(randomPartLength);

  return `${prefix}${randomPart}`.slice(0, 6).toUpperCase();
}

module.exports = {
  generateRoomCode,
};
