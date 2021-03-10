import * as fs from "fs";
import * as _ from "lodash";
import * as glob from "glob";

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

  console.log("Done!");
})();
