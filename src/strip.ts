import * as fs from "fs";
import * as path from "path";
import { ICell } from "typings/jupyter";
import { readNotebook } from "./io";
import { doesCellContainPattern, findCellIndex } from "./utils";

const fsPromises = fs.promises;

export async function stripFile(
  filePath: string,
  pattern: string | RegExp,
  clearOutputs = true
) {
  const notebook = await readNotebook(filePath);
  const cells: ICell[] = notebook["cells"];
  const filteredCells: ICell[] = [];

  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i];

    const shouldRemove = doesCellContainPattern(cell, pattern);

    if (shouldRemove) {
      if (i !== cells.length - 1) {
        const nextCell = cells[i + 1];

        if (!doesCellContainPattern(nextCell, pattern)) {
          nextCell.metadata = Object.assign({}, nextCell.metadata, {
            deletable: false,
            editable: false,
          });
        }
      }
    } else {
      if (cell.cell_type == "code") {
        if (Array.isArray(cell.source)) {
          let startReplace = false;
          let newLines = [];

          for (const line of cell.source) {
            if (line.trim() === "# YOUR CODE BEGINS") {
              newLines.push(line);
              startReplace = true;
            } else if (line.trim() === "# YOUR CODE ENDS") {
              newLines.push(line);
              startReplace = false;
            } else {
              newLines.push(startReplace ? "\n" : line);
            }
          }

          cell.source = newLines;
        }

        if (clearOutputs) {
          delete cell["execution_count"];
          delete cell["outputs"];
          delete cell["output_type"];
        }
      }

      filteredCells.push(cell);
    }
  }

  notebook["cells"] = filteredCells;

  const pathObject = path.parse(filePath);
  const newFilePath = path.format({
    dir: pathObject.dir,
    name: pathObject.name + "_stripped",
    ext: pathObject.ext,
  });

  await fsPromises.writeFile(newFilePath, JSON.stringify(notebook));
}

export async function stripTemplateCells(
  userNotebookPath: string,
  templateNotebookPath: string
) {
  const filteredCells: ICell[] = [];

  const userNotebook = await readNotebook(userNotebookPath);
  const templateNotebook = await readNotebook(templateNotebookPath);

  for (const c of userNotebook["cells"]) {
    if (findCellIndex(c, templateNotebook["cells"]) === -1) {
      filteredCells.push(c);
    }
  }

  userNotebook["cells"] = filteredCells;

  const pathObject = path.parse(userNotebookPath);
  const newFilePath = path.format({
    dir: pathObject.dir,
    name: pathObject.name + "_usercells",
    ext: pathObject.ext,
  });

  await fsPromises.writeFile(newFilePath, JSON.stringify(userNotebook));
}

export async function stripCellsByPattern(
  filePath: string,
  pattern: string | RegExp
) {
  const notebook = await readNotebook(filePath);

  notebook.cells = notebook.cells.filter(
    (cell) => !doesCellContainPattern(cell, pattern)
  );

  const pathObject = path.parse(filePath);
  const newFilePath = path.format({
    dir: pathObject.dir,
    name: pathObject.name + "_stripped",
    ext: pathObject.ext,
  });

  await fsPromises.writeFile(newFilePath, JSON.stringify(notebook));
}
