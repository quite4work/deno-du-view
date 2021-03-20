import * as base64 from "https://deno.land/std@0.90.0/encoding/base64.ts";
import { Command } from "https://deno.land/x/cmd@v1.2.0/mod.ts";
import { prettyBytes } from "https://denopkg.com/quite4work/deno-pretty-bytes";
import { readLines } from "https://deno.land/std@0.90.0/io/mod.ts";
import { html } from "https://deno.land/x/html@v1.0.0/mod.ts";

export function sunburst(duOutput) {
  const duFlat = parse(duOutput);
  duFlat.sort((a, b) => (a.path > b.path) ? 1 : -1);
  const duTree = toTree(duFlat);
  return genSunburstChartHtml(duOutput, duTree);
}

function parse(duOutput) {
  const res = [];
  for (const line of duOutput.split("\n")) {
    if (line.trim().length > 0) {
      const [size, path] = line.split(/\t/);
      res.push({
        size: Number(size),
        path: path.split("/"),
      });
    }
  }
  return res;
}

function toTree(paths) {
  const result = [];
  const level = { result };
  paths.forEach(({ path, size }) => {
    path.reduce((acc, name) => {
      if (!acc[name]) {
        acc[name] = { pathAcc: [], result: [] };
        acc.result.push({
          name,
          value: size,
          prettySize: prettyBytes(size * 1000), // du outputs in kilo bytes ?
          children: acc[name].result,
        });
      }
      return acc[name];
    }, level);
  });
  return result[0];
}

function genSunburstChartHtml(inputText, treeData) {
  const du_output = base64.encode(inputText);
  return html`
<!DOCTYPE html>
<html>
  <head>
    <script src="https://unpkg.com/sunburst-chart@1.11.2/dist/sunburst-chart.min.js"></script>
    <script src="https://unpkg.com/d3@6.5.0/dist/d3.min.js"></script>
  </head>
  <body>
    <a href="data:text/plain;charset=utf-8;base64,${du_output}" target="_blank" download="du.txt">Download data</a>
    <div id="chart"></div>
    <script>
      ${script.toString()};
      script(${JSON.stringify(treeData)});
    </script>
  </body>
</html>
`;
}

function script(data) {
  const color = d3.scaleOrdinal(d3.schemePaired);
  Sunburst().data(data).excludeRoot(true).label((d) =>
    d.name + " " + d.prettySize
  ).color((
    d,
  ) => color(d.name)).tooltipTitle((d) => d.name).tooltipContent((
    d,
  ) => d.prettySize)
    .centerRadius(0).radiusScaleExponent(1).sort((a, b) => b.value - a.value)(
      document.getElementById("chart"),
    );
}
