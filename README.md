## SQL client for PostgreSQL and MySQL

SQL client that allows you to create server connections for PostgreSQL and MySQL.
It runs on ElectronJS, Node (Express) and Vue 2.

## Features

- Tables, Views, Columns - Preview all tables or views for database as well as corresponding columns.
- Navigation - Right click on each record to open context menu.
- View Definition - Preview view definition once view is opened in query tab.
- SQL Results - Results table can display large number of records (tested on  ~700.000 rows). There are no pagination links since it uses DOM recycle to display results. Columns are resizable, cell's are clickable (if you wan't to check entire field value).
- SQL history - Check SQL history for each server you have created.
- Scripts - In query tab easily access table statements INSERT, UPDATE, DELETE.

## Installation

From your command line:

```bash
# Clone this repository
git clone https://github.com/vojvodic/sql-manager
# Go into the repository
cd sql-manager
# Install dependencies
npm install
# Run the app
npm start
```
## Examples

![Screenshot](public/examples/example_1.png?raw=true)

![Screenshot](public/examples/example_2.png?raw=true)
