// Vinext calls process.exit immediately after prerender fetches. On Windows,
// allow pending native callbacks to settle before forced Node/libuv teardown.
// Upstream context: https://github.com/nodejs/node/issues/56645
// Exit codes are preserved; Linux CI uses the original process.exit unchanged.
if (process.platform === 'win32') {
  const exit = process.exit.bind(process);
  let timer;
  process.exit = (code) => {
    process.exitCode = code ?? process.exitCode ?? 0;
    timer ??= setTimeout(() => exit(process.exitCode), 500);
  };
}
