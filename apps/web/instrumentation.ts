export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { registerOTel } = await import("@vercel/otel");
    registerOTel({
      serviceName: "wanderly-web",
      // When OTEL_EXPORTER_OTLP_ENDPOINT is set, traces go to Grafana Cloud.
      // In dev with no endpoint set, @vercel/otel uses a no-op exporter.
    });
  }
}
