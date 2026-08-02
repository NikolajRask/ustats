import { notFound } from "next/navigation";

/** Internal rewrite target when marketing routes are hit in app mode. */
export default function ModeGatePage() {
  notFound();
}
