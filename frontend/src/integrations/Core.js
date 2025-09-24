export async function InvokeLLM({ prompt } = {}) {
  // Return a simple echo-style response for local testing.
  const reply = `Echo: ${String(prompt).slice(0, 200)}`;
  return reply;
}

export default { InvokeLLM };
