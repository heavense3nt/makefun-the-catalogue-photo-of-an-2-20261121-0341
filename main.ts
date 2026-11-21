// The Ouroboros Strip — catalogue photograph of an impossible gadget.
// This program copies the bundled studio photograph to the output
// directory as /output/entry.png. No network, Node 22 stdlib only.
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const SOURCE = join(HERE, "entry.png");
const OUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const TARGET = join(OUT_DIR, "entry.png");
const MAX_BYTES = 1_048_576;
const MAX_SIDE = 1024;

function fail(message: string): never {
  console.error(`error: ${message}`);
  process.exit(1);
}

if (!existsSync(SOURCE)) fail(`missing bundled photograph: ${SOURCE}`);

const bytes = readFileSync(SOURCE);

// The gate only accepts a whole PNG or JPEG. Check the PNG signature.
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
if (!bytes.subarray(0, 8).equals(PNG_MAGIC)) fail("bundled photograph is not a PNG");
if (bytes.length > MAX_BYTES) {
  fail(`photograph is ${bytes.length} bytes, over the 1 MiB cap`);
}

// IHDR width and height are big-endian uint32 at offsets 16 and 20.
const width = bytes.readUInt32BE(16);
const height = bytes.readUInt32BE(20);
if (width > MAX_SIDE || height > MAX_SIDE) {
  fail(`photograph is ${width}x${height}, over the 1024x1024 cap`);
}

mkdirSync(OUT_DIR, { recursive: true });
copyFileSync(SOURCE, TARGET);

// Read the copy back: the gate scores exactly what lands in /output,
// so the file we ship must be byte-identical to the bundled photograph.
const shipped = readFileSync(TARGET);
if (!shipped.equals(bytes)) fail("copy is not byte-identical to the bundled photograph");

const written = statSync(TARGET);
console.log(`wrote ${TARGET} (${width}x${height}, ${written.size} bytes, verified byte-identical)`);
