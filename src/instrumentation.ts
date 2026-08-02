export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { bootstrapAdminUser } = await import("./lib/bootstrap-admin");
    await bootstrapAdminUser();
  }
}
