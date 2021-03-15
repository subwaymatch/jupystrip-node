import * as fs from "fs";
import { INotebook } from "./typings/jupyter";

const fsPromises = fs.promises;

export async function readNotebook(filePath: string): Promise<INotebook> {
  await fsPromises.access(filePath, fs.constants.F_OK);

  const originalNotebookJSON = await fsPromises.readFile(filePath, "utf-8");

  return JSON.parse(originalNotebookJSON) as INotebook;
}
