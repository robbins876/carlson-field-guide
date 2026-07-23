import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = path.join(__dirname, "data.json");

const defaultData = { rooms: {} };
const adapter = new JSONFile(file);
export const db = new Low(adapter, defaultData);

await db.read();
db.data ||= defaultData;
await db.write();
