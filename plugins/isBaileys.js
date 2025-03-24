function getdevice(id) {
  if (/^3A.{18}$/.test(id)) return 'ios';
  if (/^3E.{20}$/.test(id)) return 'web';
  if (/^(.{21}|.{32})$/.test(id)) return 'android';
  if (/^.{18}$/.test(id)) return 'desktop';
  return 'unknown';
}

function getValidPrefix() {
  return ["3EB0", "BAE5", "FELZ", "CHIO"];
}

function hasValidPrefix(id) {
  return getValidPrefix().some(prefix => id.startsWith(prefix));
}

function isBaileys(m) {
  try {
    const { id, fromMe } = m;
    if (typeof id !== "string" || !id) return false;
    if (id.length > 32 || /[^A-Z0-9]/.test(id)) return true;
    if (getdevice(id) !== 'android' && fromMe) return true;
    if (id.length === 32 && hasValidPrefix(id)) return true;
    if (id.length <= 16) return true;
    if (id.length >= 17 && id.length <= 31) return hasValidPrefix(id);
    return false;
  } catch {
    return false;
  }
}

module.exports = { isBaileys, getValidPrefix, hasValidPrefix, getdevice };