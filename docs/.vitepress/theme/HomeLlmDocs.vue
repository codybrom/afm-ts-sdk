<template>
  <div class="home-llm-docs">
    <p>
      Using an AI assistant?
      <a href="/llms.txt">llms.txt</a>
      <span class="sep">&middot;</span>
      <a href="/llms-full.txt">llms-full.txt</a>
    </p>
  </div>
</template>

<style scoped>
.home-llm-docs {
  text-align: center;
  padding: 0 2rem 2rem;
}

.home-llm-docs p {
  font-size: 0.8125rem;
  color: var(--vp-c-text-3);
  margin: 0;
}

.home-llm-docs a {
  color: var(--vp-c-text-2);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease;
}

.home-llm-docs a:hover {
  color: var(--vp-c-brand-1);
}

.sep {
  margin: 0 0.35em;
  opacity: 0.5;
}
</style>
