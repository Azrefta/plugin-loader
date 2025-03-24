const Jimp = require('jimp');
const FileType = require('file-type');
const axios = require('axios');
const util = require('util');
const fs = require('fs');

const unixTimestampSeconds = () => Math.floor(Date.now() / 1000);

const generateMessageTag = (epoch) => {
  let tag = unixTimestampSeconds().toString();
  if (epoch) tag += `.--${epoch}`;
  return tag;
};

const isEmoji = (emo) => {
let emoji_ranges = /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g;
let regexEmoji = new RegExp(emoji_ranges, 'gi');
return emo.match(regexEmoji)
}

const reSize = async (buffer, width, height) => {
  try {
    const image = await Jimp.read(buffer);
    return await image.resize(width, height).getBufferAsync(Jimp.MIME_JPEG);
  } catch (err) {
    throw err;
  }
};

const getBuffer = async (input, options = {}) => {
  if (Buffer.isBuffer(input)) return input;
  if (/^data:.*?\/.*?;base64,/i.test(input)) {
    return Buffer.from(input.split(',')[1], 'base64');
  }
  if (/^https?:\/\//.test(input)) {
    try {
      const response = await axios.get(input, { responseType: 'arraybuffer', ...options });
      return Buffer.from(response.data);
    } catch (err) {
      throw err;
    }
  }
  if (fs.existsSync(input)) return fs.readFileSync(input);
  return Buffer.alloc(0);
};

const getApi = async (url, config = {}) => {
  try {
    const { userAgent = 'Mozilla/5.0', ...options } = config;
    
    const response = await axios.get(url, {
      headers: { 'User-Agent': userAgent },
      ...options
    });

    return response.data;
  } catch (err) {
    throw err;
  }
};

const runtime = (seconds) => {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${d > 0 ? `${d} days, ` : ''}${h > 0 ? `${h} hours, ` : ''}${m > 0 ? `${m} minutes, ` : ''}${s > 0 ? `${s} seconds` : ''}`;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const toJson = (string) => JSON.stringify(string, null, 2);

const format = (...args) => util.format(...args);

const logic = (check, inp, out) => {
  if (!Array.isArray(inp) || !Array.isArray(out)) {
    throw new Error('Input and Output must be arrays');
  }
  if (inp.length !== out.length) {
    throw new Error('Input and Output must have the same length');
  }
  for (let i = 0; i < inp.length; i++) {
    if (util.isDeepStrictEqual(check, inp[i])) return out[i];
  }
  return null;
};

const bytesToSize = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = Math.max(0, decimals);
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const readFileTxt = (file) => {
  try {
    const data = fs.readFileSync(file, 'utf8').split('\n').map(line => line.trim());
    return data.length ? data[Math.floor(Math.random() * data.length)] : null;
  } catch (err) {
    return null;
  }
};

const readFileJson = (file) => {
  try {
    const jsonData = JSON.parse(fs.readFileSync(file, 'utf8'));
    return Array.isArray(jsonData) ? jsonData[Math.floor(Math.random() * jsonData.length)] : jsonData;
  } catch (err) {
    return null;
  }
};

const isWebP = (buffer) => {
  return (
    Buffer.isBuffer(buffer) &&
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('hex') === '52494646' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  );
};

const readFileJson = (file) => {
  return new Promise((resolve, reject) => {
    try {
      const jsonData = JSON.parse(fs.readFileSync(file));
      resolve(jsonData[Math.floor(Math.random() * jsonData.length)]);
    } catch (err) {
      reject(err);
    }
  });
};

const getRandomNameFile = (ext) => `${Math.floor(Math.random() * 10000)}${ext}`;

const getTypeUrlMedia = async (url) => {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    let type = response.headers['content-type'];
    if (!type) {
      const detected = await FileType.fromBuffer(response.data);
      type = detected ? detected.mime : 'unknown';
    }
    return { type, url };
  } catch (err) {
    throw err;
  }
};

const getAllHTML = async (urls) => {
  try {
    if (typeof urls === 'string') {
      const response = await axios.get(urls);
      return response.data;
    }

    if (Array.isArray(urls)) {
      return await Promise.all(
        urls.map(async (url) => {
          const res = await axios.get(url);
          return res.data;
        })
      );
    }

    throw new Error('Input harus berupa string atau array URL');
  } catch (err) {
    throw err;
  }
};

const getSizeMedia = async (path) => {
  try {
    if (/^https?:\/\//.test(path)) {
      const res = await axios.head(path);
      return bytesToSize(parseInt(res.headers['content-length'], 10), 3);
    } else if (Buffer.isBuffer(path)) {
      return bytesToSize(Buffer.byteLength(path), 3);
    } else if (fs.existsSync(path)) {
      return bytesToSize(fs.statSync(path).size, 3);
    } else {
      throw new Error('Path is not valid');
    }
  } catch (err) {
    throw err;
  }
};

function makeGlobal(functionArray) {
    functionArray.forEach((fn) => {
        if (typeof fn === 'function' && fn.name) {
            global[fn.name] = fn; 
        }
    });
}

const toString = str = (input) => {
  if (typeof input === 'string') return input;
  if (input === null) return 'null';
  if (input === undefined) return 'undefined';

  const type = typeof input;
  if (type === 'number' || type === 'boolean' || type === 'symbol') {
    return input.toString();
  }

  if (type === 'function') {
    return input.toString();
  }

  if (type === 'object') {
    try {
      return JSON.stringify({
        toString: input.toString(),
        strKoreksi: JSON.stringify(input)
      });
    } catch (error) {
      return JSON.stringify({
        toString: input.toString(),
        strKoreksi: String(input)
      });
    }
  }

  return String(input);
};

async function streamToString(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

module.exports = {
  unixTimestampSeconds,
  generateMessageTag,
  streamToString,
  isEmoji,
  reSize,
  getBuffer,
  getApi,
  runtime,
  sleep,
  toJson,
  format,
  logic,
  bytesToSize,
  readFileTxt,
  readFileJson,
  isWebP,
  getRandomNameFile,
  getTypeUrlMedia,
  getAllHTML,
  getSizeMedia
};