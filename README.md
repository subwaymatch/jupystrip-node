# Jupystrip 🦉

Jupystrip makes removing (stripping) cells from Jupyter notebooks easy. It also supports adding back cells to the original position through text match. 

Jupystrip was created to be used for instructional materials, although it is flexible enough to work with any other use cases. Common use cases include:

- Create a notebook with fully working code and remove all solution code/autograder cells before distributing it to students.
- Remove cells that have not been modified by a student to make grading faster.
- Insert autograder cells in correct positions for batch processing.

**👉 This project is still in active development.**

## Features

### 📃 Read a Jupyter notebook

A Jupyter notebook is simply a JSON file. `readNotebook` parses a Jupyter notebook as a Javascript object.

#### Function Signature
```typescript
export async function readNotebook(filePath: string): Promise<INotebook>
```

#### Example 
```typescript
await readNotebook("my_jupyter_notebook.ipynb")
```

### 🪒 Remove cells using keyword (string or RegEx)

`stripFile` removes code cells from a Jupyter notebook using either a string or a regular expression. 

#### Function Signature
```typescript
export async function stripFile(
  filePath: string,
  pattern: string | RegExp,
  clearOutputs = true
)
```

#### Example
```typescript
stripFile(
  "my_jupyter_notebook.ipynb",
  "# Remove This Cell",
  true
)
```

### ✂️ Remove template cells

`stripTemplateCells` will remove any cells that have not been modified by the user. This is used to remove all instruction cells and only leave the user portion. This requires you to specify a second path to the "template" notebook.

#### Function Signature
```typescript
export async function stripTemplateCells(
  userNotebookPath: string,
  templateNotebookPath: string
)
```

#### Example
```typescript
stripTemplateCells(
  "my_jupter_notebook.ipynb",
  "template_jupyter_notebook.ipynb"
)
```

### 📐 Add back cells

`unstrip()` can be used to insert back cells to a student's notebook.

#### Function Signature
```typescript
export async function unstripFile(
  filePath: string,
  originalFilePath: string,
  pattern: string | RegExp
)
```

#### Example

```typescript
await unstripFile(
  "student_jupyter_notebook.ipynb",
  "notebook_with_autograder_cells.ipynb",
  "# Autograder Cell"
```
