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

---

<div class="home-content">

<div class="home-links">

[Streaming](/guide/streaming) · [Structured Output](/guide/structured-output) · [Tool Calling](/guide/tools) · [OpenAI Compatible](/guide/openai-compatibility)

Requires macOS 26+ on Apple Silicon with Apple Intelligence enabled.

</div>

```ts
// npm install tsfm-sdk

import { LanguageModelSession } from "tsfm-sdk";

const session = new LanguageModelSession();
const reply = await session.respond("What is the capital of France?");
console.log(reply); // "The capital of France is Paris."
```

<div class="home-openai-box">
<div class="home-heading">Already using OpenAI?</div>
<p class="home-subheading">Change your import and keep going.</p>

```ts
import OpenAI from "tsfm-sdk/openai"; // ← just change this

const client = new OpenAI();

const response = await client.responses.create({
  // model: "gpt-4o",
  instructions: "You are a helpful assistant.",
  input: "What is the capital of France?",
});

console.log(response.output_text);

client.close();
```

<p class="home-openai-link">

[Learn more about the OpenAI compatibility layer →](/guide/openai-compatibility)

</p>
</div>

</div>
