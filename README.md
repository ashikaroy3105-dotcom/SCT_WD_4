# To-Do Web App

A to-do application built with plain HTML, CSS and JavaScript. Users can organize tasks into lists, set a due date and time, mark tasks as completed, edit them and delete them. Everything is saved in the browser.

Built as **Task 04** of the Web Development Internship at SkillCraft Technology.

## Task Requirements

| Requirement | How it is done |
|---|---|
| Add and maintain tasks | Add form, edit mode, delete button, clear completed |
| Add and organize items in lists | Sidebar with separate lists (Personal, Work, Study). Create, rename and delete lists |
| Mark tasks as completed | Checkbox on each task; completed tasks are crossed out and move to the bottom |
| Edit tasks | Edit button opens an inline form for the text, date and time |
| Set date and time of tasks | Date and time inputs when adding or editing; shown on each task |

## Features

- Multiple lists, each with a count of open tasks
- Add, edit, complete and delete tasks
- Due date and due time on every task; a time without a date means today
- **Overdue** tasks are marked with red color and the word "Overdue"
- Tasks sorted automatically: open tasks first, earliest due date first, completed tasks last
- Filter by All, Active or Completed
- Clear completed tasks in one click
- Data is saved with `localStorage`, so it stays after refreshing or closing the browser
- Empty-state messages that tell the user what to do next
- Responsive layout: sidebar becomes a row of list buttons on phones
- Keyboard friendly, visible focus outlines, screen reader announcements and reduced-motion support

## Technologies Used

- **HTML5** for structure
- **CSS3** for styling (Grid, Flexbox, CSS variables, media queries)
- **JavaScript (ES6)** for the app logic and `localStorage`
- **Google Fonts** (Bricolage Grotesque and Figtree)

## Project Structure

```
todo/
├── index.html    # Page structure
├── style.css     # Styles and responsive rules
├── script.js     # Lists, tasks, editing, sorting, storage
└── README.md     # Project documentation
```

## How to Run

1. Download or clone this repository.
2. Open the folder in **VS Code**.
3. Install the **Live Server** extension.
4. Right-click `index.html` and choose **Open with Live Server**.

You can also open `index.html` directly in a modern browser.

## How It Works

**Data model:** all data lives in one `state` object.

```js
state = {
  lists: [{ id, name }],
  tasks: [{ id, listId, text, date, time, done, created }],
  activeListId
}
```

**Render from state:** every change updates `state`, saves it to `localStorage`, and then redraws the screen with `render()`. The screen is never edited by hand, so it always matches the data.

**Sorting:** open tasks are placed before completed ones, then sorted by due date and time. Tasks without a date come after those with a date.

**Overdue check:** a task is overdue when it is not completed and its due date and time are in the past. A task with a date but no time is due at the end of that day. The labels refresh every minute.

**Safe text:** task names are inserted with `textContent`, so typed HTML is shown as text and never run.

## Testing Checklist

- [ ] Add a task with and without date and time
- [ ] Empty task is not added
- [ ] Checkbox marks a task completed and moves it down
- [ ] Edit changes text, date and time; Cancel and Esc discard changes
- [ ] Delete removes a task
- [ ] Past due date shows "Overdue"
- [ ] Create, rename and delete a list
- [ ] Filters show the right tasks
- [ ] Clear completed removes only completed tasks in the current list
- [ ] Refresh the page: lists and tasks are still there
- [ ] Layout looks correct on a phone-size screen

