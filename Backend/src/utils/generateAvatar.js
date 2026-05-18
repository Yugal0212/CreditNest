/**
 * Generate avatar URL using UI Avatars API
 */
const generateAvatarUrl = (name, backgroundColor = null) => {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  const colors = ['4F46E5', '7C3AED', 'EC4899', '06B6D4', '10B981', 'F59E0B', 'EF4444'];
  const randomColor = backgroundColor || colors[Math.floor(Math.random() * colors.length)];

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name
  )}&size=500&background=${randomColor}&color=fff&bold=true&font-size=0.4`;
};

module.exports = generateAvatarUrl;
