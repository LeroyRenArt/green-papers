(() => {
  const button = document.getElementById('copy-starter');
  const prompt = document.getElementById('pocket-prompt');
  const status = document.getElementById('copy-status');
  if (!button || !prompt || !status) return;
  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(prompt.textContent.trim());
      status.textContent = 'Starter copied. Paste it into your AI conversation.';
    } catch {
      status.textContent = 'Select the starter text to copy it, or use the text download below.';
    }
  });
})();
