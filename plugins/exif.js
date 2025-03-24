const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { tmpdir } = require('os');
const Crypto = require('crypto');
const ff = require('fluent-ffmpeg');
const FileType = require('file-type');
const webp = require('node-webpmux');

const creatorConfig = {
  author: "© Azrefta",
  packname: "Trailblazer"
};

async function imageToWebp(media, options = {}) {
  let doubleSmall = options.doubleSmall;
  let scaleFilter, padFilter;
  if (doubleSmall) {
    scaleFilter = "scale=if(lt(iw,1280)*lt(ih,1280),min(640,iw*2),min(320,iw)):" +
                  "if(lt(iw,1280)*lt(ih,1280),min(640,ih*2),min(320,ih)):" +
                  "force_original_aspect_ratio=decrease";
    padFilter = "pad=if(lt(iw,1280)*lt(ih,1280),640,320):if(lt(iw,1280)*lt(ih,1280),640,320):-1:-1:color=white@0.0";
  } else {
    scaleFilter = "scale='min(320,iw)':'min(320,ih)':force_original_aspect_ratio=decrease";
    padFilter = "pad=320:320:-1:-1:color=white@0.0";
  }
  const filterString = `${scaleFilter},fps=15,${padFilter},split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse`;
  
  const tmpFileOut = path.join(tmpdir(), `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`);
  const tmpFileIn = path.join(tmpdir(), `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.jpg`);
  fs.writeFileSync(tmpFileIn, media);
  await new Promise((resolve, reject) => {
    ff(tmpFileIn)
      .on("error", reject)
      .on("end", () => resolve(true))
      .addOutputOptions([
        "-vcodec", "libwebp",
        "-vf", filterString
      ])
      .toFormat("webp")
      .save(tmpFileOut);
  });
  const buff = fs.readFileSync(tmpFileOut);
  fs.unlinkSync(tmpFileOut);
  fs.unlinkSync(tmpFileIn);
  return buff;
}

async function videoToWebp(media, options = {}) {
  let doubleSmall = options.doubleSmall;
  let scaleFilter, padFilter;
  if (doubleSmall) {
    scaleFilter = "scale=if(lt(iw,1280)*lt(ih,1280),min(640,iw*2),min(320,iw)):" +
                  "if(lt(iw,1280)*lt(ih,1280),min(640,ih*2),min(320,ih)):" +
                  "force_original_aspect_ratio=decrease";
    padFilter = "pad=if(lt(iw,1280)*lt(ih,1280),640,320):if(lt(iw,1280)*lt(ih,1280),640,320):-1:-1:color=white@0.0";
  } else {
    scaleFilter = "scale='min(320,iw)':'min(320,ih)':force_original_aspect_ratio=decrease";
    padFilter = "pad=320:320:-1:-1:color=white@0.0";
  }
  const filterString = `${scaleFilter},fps=15,${padFilter},split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse`;

  const tmpFileOut = path.join(tmpdir(), `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`);
  const tmpFileIn = path.join(tmpdir(), `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.mp4`);
  fs.writeFileSync(tmpFileIn, media);
  await new Promise((resolve, reject) => {
    ff(tmpFileIn)
      .on("error", reject)
      .on("end", () => resolve(true))
      .addOutputOptions([
        "-vcodec", "libwebp",
        "-vf", filterString,
        "-loop", "0",
        "-ss", "00:00:00",
        "-t", "00:00:05",
        "-preset", "default",
        "-an",
        "-vsync", "0"
      ])
      .toFormat("webp")
      .save(tmpFileOut);
  });
  const buff = fs.readFileSync(tmpFileOut);
  fs.unlinkSync(tmpFileOut);
  fs.unlinkSync(tmpFileIn);
  return buff;
}

async function writeExifImg(media, metadata) {
  let wMedia = await imageToWebp(media, { doubleSmall: metadata.doubleSmall });
  const tmpFileIn = path.join(tmpdir(), `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`);
  const tmpFileOut = path.join(tmpdir(), `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`);
  fs.writeFileSync(tmpFileIn, wMedia);
  if (metadata.packname || metadata.author || metadata.isAvatar !== undefined) {
    const img = new webp.Image();
    const wr = {
      a: creatorConfig && creatorConfig.author ? creatorConfig.author : 'naze-dev',
      b: metadata.packname ? metadata.packname : (creatorConfig && creatorConfig.packname ? creatorConfig.packname : 'Bot WhatsApp'),
      c: metadata.author ? metadata.author : (creatorConfig && creatorConfig.author ? creatorConfig.author : 'Nazedev'),
      d: metadata.categories ? metadata.categories : [""],
      e: metadata.isAvatar ? metadata.isAvatar : 0
    };
    const json = {
      "sticker-pack-id": wr.a,
      "sticker-pack-name": wr.b,
      "sticker-pack-publisher": wr.c,
      "emojis": wr.d,
      "is-avatar-sticker": wr.e
    };
    const exifAttr = Buffer.from([
      0x49, 0x49, 0x2A, 0x00,
      0x08, 0x00, 0x00, 0x00,
      0x01, 0x00, 0x41, 0x57,
      0x07, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x16, 0x00,
      0x00, 0x00
    ]);
    const jsonBuff = Buffer.from(JSON.stringify(json), "utf-8");
    const exif = Buffer.concat([exifAttr, jsonBuff]);
    exif.writeUIntLE(jsonBuff.length, 14, 4);
    await img.load(tmpFileIn);
    fs.unlinkSync(tmpFileIn);
    img.exif = exif;
    await img.save(tmpFileOut);
    return tmpFileOut;
  }
}

async function writeExifVid(media, metadata) {
  let wMedia = await videoToWebp(media, { doubleSmall: metadata.doubleSmall });
  const tmpFileIn = path.join(tmpdir(), `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`);
  const tmpFileOut = path.join(tmpdir(), `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`);
  fs.writeFileSync(tmpFileIn, wMedia);
  if (metadata.packname || metadata.author || metadata.isAvatar !== undefined) {
    const img = new webp.Image();
    const wr = {
      a: creatorConfig && creatorConfig.author ? creatorConfig.author : 'naze-dev',
      b: metadata.packname ? metadata.packname : (creatorConfig && creatorConfig.packname ? creatorConfig.packname : 'Bot WhatsApp'),
      c: metadata.author ? metadata.author : (creatorConfig && creatorConfig.author ? creatorConfig.author : 'Nazedev'),
      d: metadata.categories ? metadata.categories : [""],
      e: metadata.isAvatar ? metadata.isAvatar : 0
    };
    const json = {
      "sticker-pack-id": wr.a,
      "sticker-pack-name": wr.b,
      "sticker-pack-publisher": wr.c,
      "emojis": wr.d,
      "is-avatar-sticker": wr.e
    };
    const exifAttr = Buffer.from([
      0x49, 0x49, 0x2A, 0x00,
      0x08, 0x00, 0x00, 0x00,
      0x01, 0x00, 0x41, 0x57,
      0x07, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x16, 0x00,
      0x00, 0x00
    ]);
    const jsonBuff = Buffer.from(JSON.stringify(json), "utf-8");
    const exif = Buffer.concat([exifAttr, jsonBuff]);
    exif.writeUIntLE(jsonBuff.length, 14, 4);
    await img.load(tmpFileIn);
    fs.unlinkSync(tmpFileIn);
    img.exif = exif;
    await img.save(tmpFileOut);
    return tmpFileOut;
  }
}

async function writeExif(media, metadata) {
  let wMedia;
  if (/webp/.test(media.mimetype)) {
    wMedia = media.data;
  } else if (/image/.test(media.mimetype)) {
    wMedia = await imageToWebp(media.data, { doubleSmall: metadata.doubleSmall });
  } else if (/video/.test(media.mimetype)) {
    wMedia = await videoToWebp(media.data, { doubleSmall: metadata.doubleSmall });
  } else {
    wMedia = "";
  }
  const tmpFileIn = path.join(tmpdir(), `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`);
  const tmpFileOut = path.join(tmpdir(), `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`);
  fs.writeFileSync(tmpFileIn, wMedia);
  if (metadata.packname || metadata.author || metadata.isAvatar !== undefined) {
    const img = new webp.Image();
    const wr = {
      a: creatorConfig && creatorConfig.author ? creatorConfig.author : 'naze-dev',
      b: metadata.packname ? metadata.packname : (creatorConfig && creatorConfig.packname ? creatorConfig.packname : 'Bot WhatsApp'),
      c: metadata.author ? metadata.author : (creatorConfig && creatorConfig.author ? creatorConfig.author : 'Nazedev'),
      d: metadata.categories ? metadata.categories : [""],
      e: metadata.isAvatar ? metadata.isAvatar : 0
    };
    const json = {
      "sticker-pack-id": wr.a,
      "sticker-pack-name": wr.b,
      "sticker-pack-publisher": wr.c,
      "emojis": wr.d,
      "is-avatar-sticker": wr.e
    };
    const exifAttr = Buffer.from([
      0x49, 0x49, 0x2A, 0x00,
      0x08, 0x00, 0x00, 0x00,
      0x01, 0x00, 0x41, 0x57,
      0x07, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x16, 0x00,
      0x00, 0x00
    ]);
    const jsonBuff = Buffer.from(JSON.stringify(json), "utf-8");
    const exif = Buffer.concat([exifAttr, jsonBuff]);
    exif.writeUIntLE(jsonBuff.length, 14, 4);
    await img.load(tmpFileIn);
    fs.unlinkSync(tmpFileIn);
    img.exif = exif;
    await img.save(tmpFileOut);
    return tmpFileOut;
  }
}

module.exports = {
  imageToWebp,
  videoToWebp,
  writeExifImg,
  writeExifVid,
  writeExif,
  creatorConfig
};