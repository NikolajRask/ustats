import { notFound } from "next/navigation";

/** Internal rewrite target when a path is blocked for the current USTATS_MODE. */
export default function ModeGatePage() {
  notFound();
}
