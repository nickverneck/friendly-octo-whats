import type { MatchedEvent } from "./calendar";

export function renderTemplate(
  template: string,
  payload: { groupname: string; event: MatchedEvent }
): string {
  return template
    .replaceAll("{{groupname}}", payload.groupname)
    .replaceAll("{{title}}", payload.event.summary)
    .replaceAll("{{start}}", payload.event.start ?? "")
    .replaceAll("{{end}}", payload.event.end ?? "");
}
