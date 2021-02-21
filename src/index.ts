import { promises as fs } from "fs";

const studentFilePath = "./test-files/PCard_J4s.ipynb";
const solutionFilePath = "./test-files/solution_test.ipynb";
const graderCellKeywordPattern = "# GRADER[S_ ]{0,2}ONLY";

function doesCellContainPattern(cell, keywordPattern: string | RegExp) {
  if (!(keywordPattern instanceof RegExp)) {
    keywordPattern = new RegExp(keywordPattern);
  }

  for (const line of cell.source) {
    if (line.match(keywordPattern)) {
      console.log("MATCH!");
      return true;
    }
  }

  return false;
}

(async () => {
  const studentNotebookJSON = await fs.readFile(studentFilePath, "utf-8");
  const studentNotebook = JSON.parse(studentNotebookJSON);
  const studentCells = studentNotebook["cells"];

  const solutionNotebookJSON = await fs.readFile(solutionFilePath, "utf-8");
  const solutionNotebook = JSON.parse(solutionNotebookJSON);
  const solutionCells = solutionNotebook["cells"];

  for (const cell of solutionCells) {
  }

  solutionCells.forEach((cell) => {
    const isGraderCell = doesCellContainPattern(cell, graderCellKeywordPattern);

    if (isGraderCell) {
      console.log("Grader cell!");
      console.log(cell.source);
    }
  });
})();
