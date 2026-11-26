import { connection } from "next/server";

/** Opt the current render into request time before Neon or other unstable APIs run. */
export async function duringRequest() {
  await connection();
}
