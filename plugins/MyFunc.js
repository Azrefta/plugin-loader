const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');
const os = require('os');
const esprima = require("esprima");
const chalk = require('chalk');
const crypto = require('crypto');

function truncateText(input, maxLength = 16, options = {}) {
  if (typeof input !== "string") return "";
  if (typeof maxLength !== "number" || isNaN(maxLength) || maxLength <= 0) return input;
  const { addEllipsis = true, preserveWords = false } = options;
  const ellipsis = addEllipsis ? "..." : "";
  const characters = Array.from(input);
  if (characters.length <= maxLength) return input;
  let truncated = characters.slice(0, maxLength).join("");
  if (preserveWords) {
    const lastSpace = truncated.lastIndexOf(" ");
    if (lastSpace > 0) truncated = truncated.slice(0, lastSpace);
  }
  return truncated + ellipsis;
}

const getCharRange = (start, end) => {
  return String.fromCharCode(...Array.from({ length: end - start + 1 }, (_, i) => start + i));
};

const getChars = (type = "all", start, end) => {
  if (type === "upper") return getCharRange("custom", 65, 90);
  if (type === "lower") return getCharRange("custom", 97, 122);
  if (type === "number") return getCharRange("custom", 48, 57);
  if (type === "custom" && start !== undefined && end !== undefined) {
    return String.fromCharCode(...Array.from({ length: end - start + 1 }, (_, i) => start + i));
  }
  throw new Error("Invalid type or missing start/end for custom range");
};

const color = (text, color) => {
  return color ? chalk.keyword(color)(text) : chalk.green(text);
};

const getRandomCpuName = () => {
  const cpus = os.cpus();
  if (cpus.length > 0) {
    const randomIndex = Math.floor(Math.random() * cpus.length);
    return cpus[randomIndex].model;
  }
  return 'Tidak ada informasi CPU yang tersedia.';
};

const formatErrorMessage = (err, errorTime = new Date(), stack = "Unknown", options = {}) => {
  if (!err || typeof err !== "object") {
    return "[ERROR] Unknown error occurred.";
  }
  const { colorize = false, timeFormat = "ISO", showFullStack = true } = options;
  const time = timeFormat === "ISO" ? new Date(errorTime).toISOString() : new Date(errorTime).toLocaleString();
  const errorType = err.name || "UnknownError";
  const errorMsg = err.message || "No error message provided.";
  const fullStack = err.stack || "No stack trace available.";
  let errorOutput = `
[ERROR] ${errorMsg}
- Type  : ${errorType}
- Time  : ${time}
- At    : ${stack}
${showFullStack ? `- Full Stack Trace:\n${fullStack}` : "Check logs for details."}
`;
  return colorize ? chalk.red(errorOutput) : errorOutput;
};

const totalFitur = (filePath = __filename) => {
  try {
    const absolutePath = path.resolve(filePath);
    const fileContent = fs.readFileSync(absolutePath, 'utf-8');
    const caseCount = (fileContent.match(/case/g) || []).length;
    return caseCount.toString();
  } catch (err) {
    console.error(`Gagal membaca file di lokasi: ${filePath}`, err);
    return "0";
  }
};

const getCase = (fileOrCases, cases) => {
  let fileContent;
  if (!cases) {
    cases = fileOrCases;
    fileContent = fs.readFileSync("../../server/Elysia.js", "utf-8");
  } else {
    fileContent = fs.readFileSync(fileOrCases, "utf-8");
  }
  const caseString = `case '${cases}'`;
  const caseIndex = fileContent.indexOf(caseString);
  if (caseIndex === -1) {
    return `Case '${cases}' not found.`;
  }
  const caseBlock = fileContent.split(caseString)[1].split("break")[0];
  return `case '${cases}'${caseBlock}break;`;
};

const setNet = (input, options = {}) => {
  if (input == null) return undefined;
  const { groupDomain = "@g.us", individualDomain = "@s.whatsapp.net" } = options;
  if (Array.isArray(input)) {
    return input.flatMap(item => setNet(item, options)).filter(Boolean);
  }
  if (typeof input === "number") input = input.toString();
  if (typeof input !== "string") return undefined;
  input = input.trim();
  if (input.endsWith(groupDomain) && /^[0-9]+@g\.us$/.test(input)) {
    return input;
  }
  if (input.endsWith(individualDomain) && /^[0-9]+@s\.whatsapp\.net$/.test(input)) {
    return input;
  }
  const cleanedNumber = input.replace(/\D+/g, "");
  return cleanedNumber.length >= 8 ? `${cleanedNumber}${individualDomain}` : undefined;
};

function changeToNumber(input, isEnc = true) {
  if (isEnc) {
    return input
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, '')
      .split('')
      .map(char => {
        if (char === ' ') return '00';
        if (char >= 'a' && char <= 'z') {
          let code = char.charCodeAt(0) - 96;
          return code < 10 ? '0' + code : '' + code;
        }
        if (char >= '0' && char <= '9') {
          let num = parseInt(char, 10);
          let code = 27 + num;
          return code.toString();
        }
        return char;
      })
      .join('');
  } else {
    let result = '';
    for (let i = 0; i < input.length; i += 2) {
      let token = input.substr(i, 2);
      if (token === '00') {
        result += ' ';
      } else {
        let num = parseInt(token, 10);
        if (num >= 1 && num <= 26) {
          result += String.fromCharCode(num + 96);
        } else if (num >= 27 && num <= 36) {
          result += String(num - 27);
        } else {
          result += token;
        }
      }
    }
    return result;
  }
}

function cmdGetId(m, { search, min, max }) {
  const primary = m.contextInfo && Array.isArray(m.contextInfo.mentionedJid) && m.contextInfo.mentionedJid.length ? m.contextInfo.mentionedJid : null;
  const secondary = m.mentions && Array.isArray(m.mentions) && m.mentions.length ? m.mentions : null;
  if (!primary && !secondary) {
    return { error: "Tidak ditemukan data mentionedJid atau mentions" };
  }
  const processArray = (arr) => arr.map(jid => jid.replace('@s.whatsapp.net', ''));
  function performSearch(arr, opts) {
    const { search, min, max } = opts;
    const hasSearch = typeof search !== 'undefined';
    const hasMin = typeof min !== 'undefined';
    const hasMax = typeof max !== 'undefined';
    if (!hasSearch) {
      if (hasMin && !hasMax) {
        const minDigits = Number(min);
        let filtered = arr.filter(e => e.length >= minDigits);
        if (filtered.length === 0) return null;
        filtered.sort((a, b) => Number(a) - Number(b));
        const resultArray = filtered.map(e => `${e}, ${e.length}`);
        return { status: true, text: resultArray };
      }
      if (hasMax && !hasMin) {
        const maxDigits = Number(max);
        let filtered = arr.filter(e => e.length <= maxDigits);
        if (filtered.length === 0) return null;
        filtered.sort((a, b) => Number(b) - Number(a));
        const resultArray = filtered.map(e => `${e}, ${e.length}`);
        return { status: true, text: resultArray };
      }
      if (hasMin && hasMax) {
        const minDigits = Number(min);
        const maxDigits = Number(max);
        if (minDigits === maxDigits) {
          const filtered = arr.filter(e => e.length === minDigits);
          if (filtered.length === 0) return null;
          return { status: true, text: filtered[0] };
        } else {
          let filtered = arr.filter(e => e.length >= minDigits && e.length <= maxDigits);
          if (filtered.length === 0) return null;
          filtered.sort((a, b) => Number(a) - Number(b));
          const resultArray = filtered.map(e => `${e}, ${e.length}`);
          return { status: true, text: resultArray };
        }
      }
      return null;
    }
    let filtered = arr.slice();
    if (hasMin) {
      filtered = filtered.filter(e => e.length >= Number(min));
    }
    if (hasMax) {
      filtered = filtered.filter(e => e.length <= Number(max));
    }
    if (Array.isArray(search)) {
      const allFound = search.every(s => filtered.includes(String(s)));
      return { status: allFound, text: null };
    } else {
      const searchStr = String(search);
      const found = filtered.find(e => e.includes(searchStr));
      return found ? { status: true, text: null } : { status: false, text: null };
    }
  }
  let processedPrimary = primary ? processArray(primary) : [];
  let result = primary ? performSearch(processedPrimary, { search, min, max }) : null;
  if (!result && secondary && secondary.length) {
    let processedSecondary = processArray(secondary);
    result = performSearch(processedSecondary, { search, min, max });
  }
  if (!result) {
    return { error: "Data yang dicari tidak ditemukan" };
  }
  return result;
}

const extractMentions = (input, version) => {
  if (!input) return [];
  const matches = input.match(/@\S+/g);
  if (!matches) return [];
  return matches.map((mention) => {
    const cleanedMention = mention.replace(/[^0-9]/g, '');
    return version === '@s' ? `${cleanedMention}@s.whatsapp.net` : cleanedMention;
  });
};

const getGroupAdmins = (participants) => {
  let admins = [];
  for (let i of participants) {
    i.admin === 'superadmin' ? admins.push(i.id) : i.admin === 'admin' ? admins.push(i.id) : '';
  }
  return admins || [];
};

function getSuperadminIds(participants) {
  return participants.filter(participant => participant.admin === 'superadmin').map(participant => participant.id);
}

function pad(n) {
  return n < 10 ? '0' + n : n.toString();
}

function getLocalDateForOffset(offset) {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + offset * 3600000);
}

function formatTime(date) {
  return pad(date.getHours()) + ':' + pad(date.getMinutes()) + ':' + pad(date.getSeconds());
}

function formatDate(date, lang) {
  if (lang === 'id') {
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    return days[date.getDay()] + ', ' + pad(date.getDate()) + ' ' + months[date.getMonth()] + ' ' + date.getFullYear();
  } else if (lang === 'ja') {
    const days = ["日曜日", "月曜日", "火曜日", "水曜日", "木曜日", "金曜日", "土曜日"];
    const month = date.getMonth() + 1;
    return days[date.getDay()] + ', ' + pad(date.getDate()) + ' ' + month + '月 ' + date.getFullYear();
  } else {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return days[date.getDay()] + ', ' + pad(date.getDate()) + ' ' + months[date.getMonth()] + ' ' + date.getFullYear();
  }
}

const checkNumber = (number) => {
  if (typeof number !== 'string') {
    throw new TypeError('Parameter "number" harus berupa string.');
  }
  const cleaned = number.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('81')) return 'ja';
  if (cleaned.startsWith('82')) return 'ko';
  if (cleaned.startsWith('86')) return 'zh';
  if (cleaned.startsWith('62')) return 'id';
  return 'en';
};

const getGreeting = (hour, lang) => {
  if (typeof hour !== 'number' || isNaN(hour)) {
    throw new TypeError('Parameter "hour" harus berupa angka.');
  }
  if (lang === 'id') {
    if (hour < 3) return 'Selamat Malam 🌙';
    if (hour < 6) return 'Selamat Subuh 🌅';
    if (hour < 12) return 'Selamat Pagi 🌞';
    if (hour < 15) return 'Selamat Siang ☀️';
    if (hour < 18) return 'Selamat Sore 🌇';
    if (hour < 21) return 'Selamat Malam 🌃';
    return 'Selamat Malam 🌙';
  } else if (lang === 'ja') {
    if (hour < 3) return 'こんばんは 🌙';
    if (hour < 6) return 'おはよう 🌅';
    if (hour < 12) return 'おはようございます 🌞';
    if (hour < 15) return 'こんにちは ☀️';
    if (hour < 18) return 'こんにちは 🌇';
    if (hour < 21) return 'こんばんは 🌃';
    return 'こんばんは 🌙';
  } else if (lang === 'ko') {
    if (hour < 3) return '안녕히 주무세요 🌙';
    if (hour < 6) return '좋은 새벽입니다 🌅';
    if (hour < 12) return '좋은 아침입니다 🌞';
    if (hour < 15) return '좋은 오후입니다 ☀️';
    if (hour < 18) return '좋은 저녁입니다 🌇';
    if (hour < 21) return '안녕히 주무세요 🌃';
    return '안녕히 주무세요 🌙';
  } else if (lang === 'zh') {
    if (hour < 3) return '晚安 🌙';
    if (hour < 6) return '清晨好 🌅';
    if (hour < 12) return '早上好 🌞';
    if (hour < 15) return '午安 ☀️';
    if (hour < 18) return '下午好 🌇';
    if (hour < 21) return '晚安 🌃';
    return '晚安 🌙';
  } else {
    if (hour < 3) return 'Good Night 🌙';
    if (hour < 6) return 'Good Early Morning 🌅';
    if (hour < 12) return 'Good Morning 🌞';
    if (hour < 15) return 'Good Afternoon ☀️';
    if (hour < 18) return 'Good Evening 🌇';
    if (hour < 21) return 'Good Night 🌃';
    return 'Good Night 🌙';
  }
};

const updateTimeServer = () => {
  const zones = { id: 7, en: 0, ja: 9, ko: 9, zh: 8 };
  Object.keys(zones).forEach(zone => {
    const offset = zones[zone];
    const localDate = getLocalDateForOffset(offset);
    global[zone + 'Time'] = formatTime(localDate);
    global[zone + 'Date'] = formatDate(localDate, zone);
    const hour = localDate.getHours();
    global[zone + 'Calltime'] = getGreeting(hour, zone);
  });
};

const userDate = (reg) => {
  if (typeof reg !== 'string' || reg.length < 2) {
    throw new TypeError('Parameter "reg" harus berupa string dengan minimal 2 karakter.');
  }
  const prefix = reg.slice(0, 2).toLowerCase();
  if (prefix === 'id') return global.idDate;
  if (prefix === 'ja') return global.jaDate;
  if (prefix === 'ko') return global.koDate;
  if (prefix === 'zh') return global.zhDate;
  return global.enDate;
};

const userGreeting = (reg) => {
  if (typeof reg !== 'string' || reg.length < 2) {
    throw new TypeError('Parameter "reg" harus berupa string dengan minimal 2 karakter.');
  }
  const prefix = reg.slice(0, 2).toLowerCase();
  if (prefix === 'id') return global.idCalltime;
  if (prefix === 'ja') return global.jaCalltime;
  if (prefix === 'ko') return global.koCalltime;
  if (prefix === 'zh') return global.zhCalltime;
  return global.enCalltime;
};

function random(array) {
  if (!Array.isArray(array) || array.length === 0) {
    throw new Error('Input must be a non-empty array');
  }
  const randomIndex = crypto.randomInt(0, array.length);
  return array[randomIndex];
}

const cleanGreyText = (input) => {
  let code;
  if (fs.existsSync(input) && fs.lstatSync(input).isFile()) {
    code = fs.readFileSync(input, "utf8");
  } else {
    code = input;
  }
  const tokens = esprima.tokenize(code, { comment: true });
  const cleanedCode = tokens.filter(token => token.type !== "LineComment" && token.type !== "BlockComment").map(token => token.value).join(' ').trim();
  return fs.existsSync(input) ? Buffer.from(cleanedCode, "utf8") : cleanedCode;
};

const extractDomain = (url) => {
  const regex = /^(?:https?:\/\/)?(?:www\.)?([^\/\n?]+)/i;
  const domainMatch = url.match(regex);
  if (!domainMatch) throw new Error('Invalid URL format');
  const domain = domainMatch[1];
  const domainParts = domain.split('.');
  const tld = domainParts.pop();
  const secondLevelDomain = domainParts.pop();
  return `${secondLevelDomain}.${tld}`;
};

const cleanUrl = (url) => {
  try {
    const parsedUrl = new URL(url);
    return `${parsedUrl.protocol}//${parsedUrl.hostname}`;
  } catch (error) {
    return null;
  }
};

const isUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const readmore = '͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏';

// LOGIN SISTEM -+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-

const adjectives = [
  'Brilliant', 'Luminous', 'Serene', 'Radiant', 'Elegant',
  'Mystic', 'Vivid', 'Celestial', 'Ethereal', 'Majestic'
];
const nouns = [
  'Phoenix', 'Horizon', 'Aurora', 'Nebula', 'Echo',
  'Zenith', 'Harmonia', 'Lyra', 'Mirage', 'Solstice'
];
const domainPrefixes = [
  'stellar', 'horizon', 'lumina', 'aether', 'nebula',
  'radiance', 'seraphic', 'elysium', 'celestia', 'harmonia'
];
const tlds = ['com', 'net', 'org', 'io', 'co', 'xyz', 'ai'];

const getRandomElement = (array) => array[crypto.randomInt(0, array.length)];

const removeSpaces = (text) => text.replace(/\s+/g, '');

const generateDomain = () => {
  const domain = `${getRandomElement(domainPrefixes)}.${getRandomElement(tlds)}`;
  return removeSpaces(domain);
};

const generateEmail = () => {
  const localPart = `${getRandomElement(adjectives)}${getRandomElement(nouns)}`.toLowerCase();
  return `${removeSpaces(localPart)}@${generateDomain()}`;
};

const formatUsername = (username, options = {}) => {
  if (typeof username !== "string") return "";
  const { allowNumbers = true, allowUnderscore = false, capitalize = true } = options;
  let pattern = allowNumbers
    ? allowUnderscore
      ? /[^a-zA-Z0-9_]/g
      : /[^a-zA-Z0-9]/g
    : allowUnderscore
      ? /[^a-zA-Z_]/g
      : /[^a-zA-Z]/g;
  let formattedUsername = username.replace(pattern, "").toLowerCase();
  return capitalize ? formattedUsername.charAt(0).toUpperCase() + formattedUsername.slice(1) : formattedUsername;
};

const generatePassword = (length = 8, options = {}) => {
  const { upperCase = true, lowerCase = true, numbers = true, specialChars = true, customChars = "" } = options;
  let availableChars = "";
  if (upperCase) availableChars += getCharRange(65, 90);
  if (lowerCase) availableChars += getCharRange(97, 122);
  if (numbers) availableChars += getCharRange(48, 57);
  if (specialChars) availableChars += "!@#$%^&*()_-+=<>?/{}[]~";
  if (customChars) availableChars += customChars;
  if (!availableChars.length) {
    throw new Error("At least one character type must be selected.");
  }
  const password = Array.from({ length }, () => {
    return availableChars[crypto.randomInt(0, availableChars.length)];
  }).join("");
  return password;
};

// -+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-

module.exports = {
  truncateText,
  getCharRange,
  formatUsername,
  generatePassword,
  getChars,
  color,
  generateEmail,
  generateDomain,
  removeSpaces,
  getRandomCpuName,
  formatErrorMessage,
  totalFitur,
  getCase,
  setNet,
  changeToNumber,
  cmdGetId,
  extractMentions,
  getGroupAdmins,
  getSuperadminIds,
  pad,
  getLocalDateForOffset,
  formatTime,
  formatDate,
  checkNumber,
  getGreeting,
  updateTimeServer,
  userDate,
  userGreeting,
  random,
  cleanGreyText,
  extractDomain,
  cleanUrl,
  isUrl,
  extractUrl,
  readmore
};