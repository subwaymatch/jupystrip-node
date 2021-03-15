import { ICell } from "./typings/jupyter";
import * as stringSimilarity from "string-similarity";

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
  }

  // No match
  return -1;
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
