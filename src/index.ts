import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";
import { exportPDFs } from "./export-pdfs";

yargs(hideBin(process.argv))
  .option("html-dir", {
    description: "The directory containing the exported notion HTML files",
    type: "string",
    demandOption: true,
  })
  .command({
    command: "export-pdf <output-dir>",
    aliases: ["pdf"],
    describe: "Export All Pages as PDF Docs",
    builder: (yargs) =>
      yargs.positional("output-dir", {
        description: "The output directory for the PDF files",
        type: "string",
        demandOption: true,
      }),
    handler: async (argv) => await exportPDFs(argv),
  })
  .demandCommand()
  .parse();
