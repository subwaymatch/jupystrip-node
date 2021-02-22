import { promises as fs } from "fs";
import * as path from "path";
import * as _ from "lodash";
import * as stringSimilarity from "string-similarity";

const studentFilePath = "./test-files/test_starter.ipynb";
const solutionFilePath = "./test-files/test_solution.ipynb";
const graderCellKeywordPattern = "# GRADER[S_ ]{0,2}ONLY";

export interface ICell {
  cell_type: string;
  metadata: any;
  source: string | string[];
}

export enum CellInsertPosition {
  First = "First",
  Last = "Last",
  BeforeCell = "BeforeCell",
}

export interface IInsertCellGroup {
  cells: ICell[];
  insertPosition: CellInsertPosition;
  matchCell?: ICell;
}

function doesCellContainPattern(cell: ICell, pattern: string | RegExp) {
  if (!(pattern instanceof RegExp)) {
    pattern = new RegExp(pattern);
  }

  // Notebook cells can either be a string or an array of strings
  // If string, convert it to am array of strings
  const lines = Array.isArray(cell.source) ? cell.source : [cell.source];

  for (const line of lines) {
    if (line.match(pattern)) {
      return true;
    }
  }

  return false;
}

function getEmptyInsertCellGroup() {
  return {
    cells: [],
    insertPosition: null,
    matchCell: null,
  };
}

function getInsertCellGroups(cells: ICell[]): IInsertCellGroup[] {
  const groups: IInsertCellGroup[] = [];

  let group: IInsertCellGroup = null;

  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i];
    const isGraderCell = doesCellContainPattern(cell, graderCellKeywordPattern);

    if (isGraderCell) {
      group = group ? group : getEmptyInsertCellGroup();
      group.cells.push(cell);

      // Determine insert position
      if (!group.insertPosition) {
        if (i == 0) {
          group.insertPosition = CellInsertPosition.First;
        } else if (i == cells.length - 1) {
          group.insertPosition = CellInsertPosition.Last;
          groups.push(group);
        } else {
          if (!doesCellContainPattern(cells[i + 1], graderCellKeywordPattern)) {
            group.insertPosition = CellInsertPosition.BeforeCell;
            group.matchCell = cells[i + 1];
          }
        }
      }
    } else {
      if (group) {
        groups.push(group);
        group = null;
      }
    }
  }

  return groups;
}

function findCellIndex(cell: ICell): number {
  return -1;
}

(async () => {
  const studentNotebookJSON = await fs.readFile(studentFilePath, "utf-8");
  const studentNotebook = JSON.parse(studentNotebookJSON);
  let studentCells = studentNotebook["cells"];

  const solutionNotebookJSON = await fs.readFile(solutionFilePath, "utf-8");
  const solutionNotebook = JSON.parse(solutionNotebookJSON);
  const solutionCells = solutionNotebook["cells"];

  const insertCellGroups = getInsertCellGroups(solutionCells);

  console.log(`insertCellGroups`);
  console.log(insertCellGroups);

  let studentNotebookClone = _.cloneDeep(studentNotebook);
  let unstrippedCells = studentNotebookClone["cells"];

  for (const group of insertCellGroups) {
    if (group.insertPosition === CellInsertPosition.First) {
      unstrippedCells = group.cells.concat(unstrippedCells);
    } else if (group.insertPosition === CellInsertPosition.BeforeCell) {
      // Do nothing
    } else if (group.insertPosition === CellInsertPosition.Last) {
      unstrippedCells = unstrippedCells.concat(group.cells);
    }
  }

  studentNotebookClone["cells"] = unstrippedCells;

  const pathObject = path.parse(studentFilePath);

  console.log(pathObject);

  const newFilePath = path.format({
    dir: pathObject.dir,
    name: pathObject.name + "_unstripped",
    ext: pathObject.ext,
  });

  console.log(newFilePath);

  await fs.writeFile(newFilePath, JSON.stringify(studentNotebookClone));
})();
