export default {
  expo: {
    name: "OneTouchApp",
    slug: "onetouchapp", 
    version: "1.0.0",
    orientation: "portrait",
    platforms: ["ios", "android", "web"],
    android: {
      jsEngine: "jsc"  // Use JSC instead of Hermes
    },
    web: {
      bundler: "metro"
    },
    sdkVersion: "53.0.0"
  }
};