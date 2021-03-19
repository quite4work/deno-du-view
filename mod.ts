import * as base64 from "https://deno.land/std@0.90.0/encoding/base64.ts";
import { Command } from "https://deno.land/x/cmd@v1.2.0/mod.ts";
import { prettyBytes } from "https://denopkg.com/quite4work/deno-pretty-bytes";
import { readLines } from "https://deno.land/std@0.90.0/io/mod.ts";

export function sunburst(duOutput) {
  let flat = parse(duOutput);
  let tree = toTree(flat);
  return genSunburstChartHtml(duOutput, tree);
}

function parse(duOutput) {
  let res = [];
  for (let line of duOutput.split("\n")) {
    line = line.trim();
    if (line.length > 0) {
      let [size, path] = line.split(/\t/);
      res.push({
        size: Number(size),
        path: path,
      });
    }
  }
  res.sort((a, b) => (a.path > b.path) ? 1 : -1);
  return res;
}

function toTree(paths) {
  let result = [];
  let level = { result };
  paths.forEach(({ path, size }) => {
    path.split("/").reduce((acc, name) => {
      if (!acc[name]) {
        acc[name] = { pathAcc: [], result: [] };
        acc.result.push({
          name,
          value: size,
          prettySize: prettyBytes(size * 1000), // du outputs in kilo bytes
          children: acc[name].result,
        });
      }
      return acc[name];
    }, level);
  });
  return result[0];
}

function genSunburstChartHtml(inputText, treeData) {
  let du_output = base64.encode(inputText);
  return `
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
  Sunburst().data(data).label((d) => d.name + "　" + d.prettySize).color((
    d,
  ) => color(d.name)).tooltipTitle((d) => d.name).tooltipContent((
    d,
  ) => d.prettySize)
    .centerRadius(0).radiusScaleExponent(1).sort((a, b) => b.value - a.value)(
      document.getElementById("chart"),
    );
}
