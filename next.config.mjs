// নিরাপত্তা হেডার। পুরো Content-Security-Policy বসানো হয়নি, কারণ Next.js-এর inline script-এর জন্য nonce লাগে (README-তে সীমাবদ্ধতা)
const securityHeaders = [
  // অন্য সাইটে iframe-এ ঢুকিয়ে ক্লিক-চুরি আটকায়
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'" },
  // ব্রাউজার ফাইলের ধরন আন্দাজ করতে পারবে না
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // শুধু HTTPS-এ চলবে (localhost-এ ব্রাউজার এটি উপেক্ষা করে)
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // API-র উত্তর (যেমন দাতার ফোন নম্বর) যেন কোথাও জমা না থাকে
      { source: "/api/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] },
    ];
  },
};

export default nextConfig;