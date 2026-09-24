// a directory deployed with --dir needs a disco.json; say what to do next instead of
// failing later on the server. (a github repo is cloned by the server, which is the only
// place that can look inside it.)

export const DISCO_JSON_DOCS = 'https://disco.cloud/docs/disco-json/'
export const EXAMPLE_REPO = 'https://github.com/letsdiscodev/example-flask-site'

export function missingDiscoJsonMessage(where: string): string {
  return (
    `No disco.json in ${where}.\n` +
    'A project needs a disco.json at its root (and usually a Dockerfile) so Disco knows what to run.\n' +
    `Docs: ${DISCO_JSON_DOCS}\n` +
    `A working example to copy from: ${EXAMPLE_REPO}`
  )
}
