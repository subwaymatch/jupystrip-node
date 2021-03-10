import { INotebook, ICell } from "./typings/jupyter";
import { CellInsertPosition, IInsertCellGroup } from "./typings/unstrip";
import { doesCellContainPattern, findCellIndex } from "utils";
import * as fs from "fs";
import * as path from "path";

const fsPromises = fs.promises;

export function getEmptyInsertCellGroup(): IInsertCellGroup {
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

export async function unstripFiles(
  filePaths: string[],
  originalFilePath: string,
  pattern: string | RegExp
) {
  await fsPromises.access(originalFilePath, fs.constants.F_OK);

  const originalNotebookJSON = await fsPromises.readFile(
    originalFilePath,
    "utf-8"
  );
  const originalNotebook = JSON.parse(originalNotebookJSON);
  const originalCells = originalNotebook["cells"];
  const insertCellGroups = getInsertCellGroups(originalCells, pattern);

  for (const filePath of filePaths) {
    await fsPromises.access(filePath, fs.constants.F_OK);

    const targetNotebookJSON = await fsPromises.readFile(filePath, "utf-8");
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

    await fsPromises.writeFile(newFilePath, JSON.stringify(targetNotebook));
  }
}

export async function unstripFile(
  filePath: string,
  originalFilePath: string,
  pattern: string | RegExp
) {
  await unstripFiles([filePath], originalFilePath, pattern);
}
