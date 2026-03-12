---
layout: home

hero:
  name: tsfm
  text: On-device Apple Intelligence in Node.js
  tagline: "TypeScript SDK for Apple's Foundation Models.<br>No keys. No servers. <i>It just works.</i>"
  image:
    src: /logo.svg
    alt: tsfm
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/codybrom/tsfm

features:
  - icon: 🔒
    title: On-Device Inference
    details: Runs entirely on Apple Silicon. Your data never leaves the machine — no network requests, no API keys.
  - icon: ⚡
    title: Streaming Generation
    details: Async iterator interface for token-by-token streaming. Process responses as they're generated.
  - icon: 🧩
    title: Structured Output
    details: Typed schemas with generation guides constrain output to exactly the shape you need.
  - icon: 🛠️
    title: Tool Calling
    details: Give the model tools to call during generation. Define schemas, implement handlers, get structured results.
  - icon: 🔄
    title: OpenAI Compatible
    details: Drop-in replacement for the OpenAI SDK. Same messages, same responses, same streaming — backed by on-device inference.
---
