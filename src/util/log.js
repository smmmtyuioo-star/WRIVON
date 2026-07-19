// Tiny logger. Writes to stderr; respects NO_COLOR.

const colorOn = !process.env.NO_COLOR && process.stdout.isTTY;
const c = (code, s) => (colorOn ? `\x1b[${code}m${s}\x1b[0m` : s);

export const log = {
  info:    (m) => process.stderr.write(`wrivon: ${m}\n`),
  warn:    (m) => process.stderr.write(`${c(33, "wrivon: warn:")} ${m}\n`),
  error:   (m) => process.stderr.write(`${c(31, "wrivon: error:")} ${m}\n`),
  ok:      (m) => process.stderr.write(`${c(32, "wrivon: ok:")} ${m}\n`),
  debug:   (m) => { if (process.env.WRIVON_DEBUG) process.stderr.write(`wrivon: debug: ${m}\n`); },
};
