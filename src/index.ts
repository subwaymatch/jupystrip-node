import * as _ from "lodash";
import * as glob from "glob";
import { stripFile } from "./strip";

(async () => {
  const graderCellKeywordPattern = "# GRADER[S_ ]{0,2}ONLY";
  const submissionFilePaths = glob.sync(
    "C:/Users/Park/Documents/accy575-sp2021-grading/03-database/organized/*.ipynb"
  );

  // for (const p of submissionFilePaths) {
  //   console.log(`Stripping ${p}`);
  //   await stripTemplateCells(
  //     p,
  //     "C:/Users/Park/Documents/accy575-sp2021-grading/03-database/Database_Starter_23Feb2021.ipynb"
  //   );
  // }

  await stripFile(
    "C:/Users/Park/Box/Park_Sp2021/BDI475/case-studies/09-ridesharing-vehicles/case-study-03-rideshare-vehicles-SOLUTION.ipynb",
    graderCellKeywordPattern,
    true
  );

  console.log("Done!");
})();
