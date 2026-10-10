(() => {
  document.querySelectorAll('button[data-copy-target]').forEach((button) => {
    const prompt = document.getElementById(button.dataset.copyTarget);
    const status = document.getElementById(button.dataset.copyStatus);
    if (!prompt || !status) return;
    button.addEventListener('click', async () => {
      status.textContent = '';
      try {
        await navigator.clipboard.writeText(prompt.textContent.trim());
        status.textContent = 'Copied. Paste it into your conversation.';
      } catch {
        status.textContent = 'Select the prompt text above and copy it directly.';
      }
    });
  });
})();
