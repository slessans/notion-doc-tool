import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";

export interface Params {
  htmlDir: string;
  outputDir: string;
}

// a regex that detects if string ends with a 32-character random alphanumeric ID
const endsWithRandomIdRegex = /\s[a-zA-Z0-9]{32}$/;

function cleanPath(relativePath: string): string {
  // each component in the path ends with a 32-character random alphanumeric ID, remove this from each segment
  return relativePath
    .split(path.sep)
    .map((segment) => {
      if (endsWithRandomIdRegex.test(segment)) {
        return segment.slice(0, -32).trim();
      }
      return segment;
    })
    .join(path.sep);
}

function getOutputFileName(fileName: string): string {
  const parsed = path.parse(fileName);
  let name = parsed.name;
  if (endsWithRandomIdRegex.test(name)) {
    name = name.slice(0, -32).trim();
  }
  return `${name}.pdf`;
}

async function exportPDF(filePath: string, outputPath: string) {
  console.log(`${filePath} -> ${outputPath}`);
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto(`file://${filePath}`);

  // page.emulateMediaType("screen");

  await page.pdf({
    path: outputPath,
    margin: { top: "100px", right: "50px", bottom: "100px", left: "50px" },
    printBackground: true,
    format: "A4",
  });

  await browser.close();
}

export async function exportPDFs({
  htmlDir,
  outputDir: outputBaseDir,
}: Params) {
  if (fs.existsSync(outputBaseDir)) {
    throw new Error(`Output directory already exists: ${outputBaseDir}`);
  }
  const toVisit = [htmlDir];
  while (true) {
    const nextDirPath = toVisit.shift();
    if (!nextDirPath) {
      break;
    }
    const dirRelativePath = path.relative(htmlDir, nextDirPath);
    const cleanedOutputPath = cleanPath(dirRelativePath);
    const children = await fs.promises.readdir(nextDirPath, {
      withFileTypes: true,
    });
    for (const dirEntry of children) {
      const fullPath = path.join(nextDirPath, dirEntry.name);
      if (dirEntry.isDirectory()) {
        toVisit.push(fullPath);
      } else if (dirEntry.isFile() && dirEntry.name.endsWith(".html")) {
        const outputDir = path.join(outputBaseDir, cleanedOutputPath);
        await fs.promises.mkdir(outputDir, { recursive: true });
        const outputPath = path.join(
          outputDir,
          getOutputFileName(dirEntry.name)
        );
        await exportPDF(fullPath, outputPath);
      }
    }
  }
}
