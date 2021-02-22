import { promises as fs } from "fs";
import * as path from "path";
import * as _ from "lodash";
import * as stringSimilarity from "string-similarity";
import * as glob from "glob";

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

export function doesCellContainPattern(cell: ICell, pattern: string | RegExp) {
  if (!(pattern instanceof RegExp)) {
    pattern = new RegExp(pattern);
  }

  // Notebook cells can either be a string or an array of strings
  // If string, convert it to an array of strings
  const lines = Array.isArray(cell.source) ? cell.source : [cell.source];

  for (const line of lines) {
    if (line.match(pattern)) {
      return true;
    }
  }

  return false;
}

export function getEmptyInsertCellGroup() {
  return {
    cells: [],
    insertPosition: null,
    matchCell: null,
  };
}

export function getInsertCellGroups(
  cells: ICell[],
  pattern: string | RegExp
): IInsertCellGroup[] {
  const groups: IInsertCellGroup[] = [];

  let group: IInsertCellGroup = null;

  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i];
    const isGraderCell = doesCellContainPattern(cell, pattern);

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
          if (!doesCellContainPattern(cells[i + 1], pattern)) {
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

export function cellToString(cell: ICell, includeType = false) {
  // Notebook cells can either be a string or an array of strings
  // If array, convert it to a string
  let cellStr = Array.isArray(cell.source)
    ? cell.source.join(",")
    : cell.source;

  if (includeType) {
    cellStr = `[${cell.cell_type}] ${cellStr}`;
  }

  return cellStr;
}

export function findCellIndex(
  findCell: ICell,
  cells: ICell[],
  matchType = true
): number {
  const findCellStr = cellToString(findCell, matchType);
  const cellStrs = cells.map((o) => cellToString(o, matchType));

  const similarityMatches = stringSimilarity.findBestMatch(
    findCellStr,
    cellStrs
  );

  if (similarityMatches.bestMatch.rating >= 0.9) {
    return similarityMatches.bestMatchIndex;
  } else {
    console.log("===================");
    console.log(`Unable to find a matching cell position`);
    console.log(findCellStr);
    console.log(similarityMatches.bestMatch);
  }

  // No match
  return -1;
}

export async function unstripFiles(
  filePaths: string[],
  originalFilePath: string,
  pattern: string | RegExp
) {
  const originalNotebookJSON = await fs.readFile(originalFilePath, "utf-8");
  const originalNotebook = JSON.parse(originalNotebookJSON);
  const originalCells = originalNotebook["cells"];
  const insertCellGroups = getInsertCellGroups(originalCells, pattern);

  for (const filePath of filePaths) {
    console.log(`Unstripping ${filePath}`);

    const targetNotebookJSON = await fs.readFile(filePath, "utf-8");
    const targetNotebook = JSON.parse(targetNotebookJSON);
    let unstrippedCells = targetNotebook["cells"];

    for (const group of insertCellGroups) {
      if (group.insertPosition === CellInsertPosition.First) {
        unstrippedCells = group.cells.concat(unstrippedCells);
      } else if (group.insertPosition === CellInsertPosition.BeforeCell) {
        // Do nothing
        const insertIndex = findCellIndex(group.matchCell, unstrippedCells);

        if (insertIndex >= 0) {
          unstrippedCells = [
            ...unstrippedCells.slice(0, insertIndex),
            ...group.cells,
            ...unstrippedCells.slice(insertIndex),
          ];
        } else {
          // If a matching cell is not found, insert the cells to the end of the notebook
          unstrippedCells = unstrippedCells.concat(group.cells);
        }
      } else if (group.insertPosition === CellInsertPosition.Last) {
        unstrippedCells = unstrippedCells.concat(group.cells);
      }
    }

    targetNotebook["cells"] = unstrippedCells;

    const pathObject = path.parse(filePath);
    const newFilePath = path.format({
      dir: pathObject.dir,
      name: pathObject.name + "_unstripped",
      ext: pathObject.ext,
    });

    await fs.writeFile(newFilePath, JSON.stringify(targetNotebook));
  }
}

export async function unstripFile(
  filePath: string,
  originalFilePath: string,
  pattern: string | RegExp
) {
  await unstripFiles([filePath], originalFilePath, pattern);
}

(async () => {
  const solutionFilePath =
    "C:/Users/Park/Documents/accy575-sp2021-grading/02-pcard/PCard_Solution_20210203.ipynb";
  const graderCellKeywordPattern = "# GRADER[S_ ]{0,2}ONLY";

  // await unstripFile(
  //   studentFilePath,
  //   solutionFilePath,
  //   graderCellKeywordPattern
  // );

  const filePaths = glob.sync(
    "C:/Users/Park/Documents/accy575-sp2021-grading/02-pcard/**/*.ipynb"
  );

  console.log(`Start unstripping ${filePaths.length} files`);

  await unstripFiles(filePaths, solutionFilePath, graderCellKeywordPattern);

  console.log("Done!");
})();
