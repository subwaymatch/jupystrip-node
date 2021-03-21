import * as _ from "lodash";
import * as glob from "glob";
import { stripCellsByPattern, stripFile, stripTemplateCells } from "./strip";

(async () => {
  const graderCellKeywordPattern = "# GRADER[S_ ]{0,2}ONLY";
  const confCallTranscriptKeyword = `qa_text\\s*=\\s*'''`;
  const submissionFilePaths = glob.sync(
    "C:/Users/Park/Documents/accy575-sp2021-grading/04-conf-call/stripped/!(*_stripped).ipynb"
  );

  for (const p of submissionFilePaths) {
    console.log(`Stripping ${p}`);
    await stripCellsByPattern(p, confCallTranscriptKeyword);
  }

  // await stripFile(
  //   "C:/Users/Park/Box/Park_Sp2021/BDI475/in-class-exercises/L14-working-with-pandas-SOLUTION.ipynb",
  //   graderCellKeywordPattern
  // );

  // await stripFile(
  //   "C:/Users/Park/Box/Park_Sp2021/ACCY575/Cases_Sp20/5-Yellow Cab/Yellow Cab v04.06_SOLN_17Mar2021.ipynb",
  //   graderCellKeywordPattern
  // );

  console.log("Done!");
})();
