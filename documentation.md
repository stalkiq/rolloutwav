# Rollout HQ Application Documentation

This document provides a detailed breakdown of each page and its interactive elements within the Rollout HQ application. This guide is intended to assist with the development of a mobile application version using Xcode.

---

## 1. Login Page (`/login`)

This is the entry point for users to access the application. It provides a standard authentication form.

### Page Overview

- **Purpose**: To authenticate users before they can access the main application.
- **Layout**: A centrally aligned form on a styled background.

### Buttons and Inputs

- **Close Button (`X` icon)**:
  - **Location**: Top-right corner of the login card.
  - **Action**: A placeholder button. In a full application, this might redirect to a homepage or a "sign-up" page. Currently, it has no action.

- **Username Input**:
  - **Label**: `Username`
  - **Action**: A standard text field for the user to enter their username. It is pre-filled with "test" for prototype purposes.

- **Password Input**:
  - **Label**: `Password`
  - **Action**: A standard password field for the user to enter their password. It is pre-filled with "test" for prototype purposes.

- **Show/Hide Password Button (`Eye`/`EyeOff` icon)**:
  - **Location**: Inside the password input field.
  - **Action**: Toggles the visibility of the password text, switching between plain text and obscured characters.

- **Forgot Password Button**:
  - **Location**: Below the password input, on the right.
  - **Action**: A link that would typically navigate to a password recovery flow. Currently a placeholder.

- **Sign in Button**:
  - **Location**: The main call-to-action button at the bottom of the form.
  - **Action**: Submits the form. In this prototype, it simulates a successful login by setting an `authenticated` flag in the browser's local storage and redirects the user to the main landing page (`/`).

---

## 2. Landing Page / Album Selection (`/`)

After logging in, users land on this page, which displays all their "albums" or top-level project folders.

### Page Overview

- **Purpose**: To provide a high-level overview of all albums and allow users to create new ones or navigate into an existing one.
- **Layout**: A grid of album cards with a button to add a new album.

### Buttons and Inputs

- **StalkIQ Dropdown Menu**:
  - **Location**: Top-left corner of the page.
  - **Action**: Opens a dropdown menu with the following options:
    - **Settings**: A placeholder menu item.
    - **Logout**: Logs the user out by clearing the `authenticated` flag from local storage and redirecting to the login page.

- **Album Card**:
  - **Location**: The main grid area. Each album is represented by a card.
  - **Action**: Clicking on an album card navigates the user to the `Projects Dashboard` (`/projects?album=<album_id>`) for that specific album. The album cover is displayed if one was uploaded; otherwise, the album name is shown.

- **Add New Album Button (`+` icon)**:
  - **Location**: In the grid, after the list of existing albums.
  - **Action**: Opens the "Add New Album" dialog.

### "Add New Album" Dialog

- **Name Input**:
  - **Label**: `Name`
  - **Action**: A text field to enter the name for the new album.

- **Cover Art Input**:
  - **Label**: `Cover Art`
  - **Action**: A file input that allows the user to select an image file to use as the album's cover art.

- **Cancel Button**:
  - **Action**: Closes the dialog without creating a new album.

- **Create Album Button**:
  - **Action**: Creates a new album with the specified name and optional cover art, adds it to the grid, and closes the dialog.

---

## 3. Projects Dashboard Page (`/projects`)

This page displays all the projects (e.g., songs, videos) within a selected album.

### Page Overview

- **Purpose**: To manage all projects for a specific album in a list or board view.
- **Layout**: A two-column layout with a sidebar on the left and the main project dashboard on the right.

### Sidebar Buttons and Inputs

- **Album Switcher Dropdown**:
  - **Location**: Top of the sidebar. Shows the current album name.
  - **Action**: Opens a dropdown menu to switch between different albums. Selecting an album reloads the page with the projects for that album. Also contains **Settings** and **Logout** options.

- **Home Button (`Home` icon)**:
  - **Location**: Top-right of the sidebar header.
  - **Action**: Navigates back to the main landing page (`/`).

- **Album Cover Art**:
  - **Location**: Below the sidebar header.
  - **Action**: Clicking the cover art area opens a larger view of the image. This area also serves as a drop zone; dragging a project from the list and dropping it here marks the project's status as "Done."

- **Sidebar Menu Buttons**:
  - **`${albumName}`**: Filters the project list to show only projects with the status "Done".
  - **Projects**: Clears any active filter, showing all projects.
  - **Views**: A placeholder button.
  - **Import Issues**, **Invite people**, **Initiatives**: Placeholder buttons for future functionality.

### Main Content Buttons and Inputs

- **Add project Button**:
  - **Location**: Top-right of the main content area.
  - **Action**: Opens the "Create New Project" dialog.

- **Display Dropdown Menu**:
  - **Location**: Next to the "Add project" button.
  - **Action**: Opens a dropdown to control how projects are displayed. It includes options for view modes (List, Board, Timeline), grouping, ordering, and toggling which properties are visible in the project list.

- **Filter Button**:
  - **Location**: Below the header, on the left.
  - **Action**: A placeholder for future project filtering functionality.

- **Project List/Table**:
  - **Location**: The main area of the page.
  - **Action**: Each row represents a project.
    - **Row Click**: Navigates to the `Project Detail Page` (`/project/<project_id>`) for that project.
    - **Draggable Rows**: Rows can be dragged. Dropping a project onto the album art in the sidebar changes its status to "Done".
    - **Priority Icon**: Clicking this icon in a project row opens a popover to change the project's priority (Urgent, High, Medium, Low, No priority).

---

## 4. Project Detail Page (`/project/[id]`)

This page provides an in-depth view of a single project, including its properties, files, updates, and timeline.

### Page Overview

- **Purpose**: To be the central hub for all information and collaboration related to a single project.
- **Layout**: A multi-section layout with a header, a main content area on the left, and a properties sidebar on the right. An audio player appears at the bottom when a track is played.

### Header Buttons

- **Projects Link**:
  - **Location**: Top-left in the header.
  - **Action**: Navigates back to the `Projects Dashboard` for the current album.

- **Upload Song Button**:
  - **Location**: Next to the project name.
  - **Action**: Opens a file dialog to upload the final song file for the project.

- **Timeline Button**:
  - **Location**: Next to the "Upload Song" button.
  - **Action**: Opens a sheet from the side displaying the project's vertical timeline.

- **Overview Popover Button**:
  - **Location**: Next to the "Timeline" button.
  - **Action**: Opens a popover that provides a summary of all uploaded files (verses, hooks, beats, samples). From here, you can select files for the final mix and upload new ones using the `+` buttons.

- **Edit Project Button (`Pencil` icon)**:
  - **Location**: Top-right of the header.
  - **Action**: Opens the "Edit Project" dialog to change the project's name.

- **Copy Link Button (`Link` icon)**:
  - **Location**: Top-right of the header.
  - **Action**: Copies the current page URL to the clipboard.

### Main Content Area

- **File Sections (Verses, Hooks, Beats, Samples)**:
  - **Layout**: Each section has a label and a `+` button to upload new files. Uploaded files appear as buttons.
  - **File Button**: Clicking an uploaded audio file will load it into the audio player at the bottom of the screen and start playing it.
  - **Plus Button (`+`)**: Opens a file dialog to upload a new file for that category.

- **Latest Update Section**:
  - **New update Button**: Opens a dialog to post a new status update for the project (text and health status).
  - **All Button**: Opens a sheet from the side displaying a full history of all project updates.

- **Description Section**:
  - **Action**: The description text is editable. Clicking on it turns it into a textarea where you can modify the project's description.

### Right Sidebar (Properties)

- **Status Dropdown**: Allows changing the project's status (e.g., Backlog, In Progress, Done).
- **Priority Dropdown**: Allows changing the project's priority.
- **Lead Button**: A placeholder to assign a project lead.
- **Artists/Producers/Writers Buttons**: Each opens a dialog to add a new person (with name, email, phone) to the respective category.
- **Dates Buttons**: Opens a calendar popover to set the project's start and target dates.
- **Teams/Labels Buttons**: Placeholder buttons.
- **Milestones Section**: Displays a list of project milestones. The `+` button opens a dialog to add a new milestone.

### Audio Player

- **Location**: Appears fixed at the bottom of the screen when an audio file is played.
- **Controls**:
  - **Play/Pause Button**: Toggles playback of the current track.
  - **Progress Bar/Slider**: Shows the current playback position and allows seeking.
  - **Time Display**: Shows the current time and total duration of the track.
  - **Mute/Unmute Button**: Toggles the audio volume.
  - **Close Button (`X`)**: Closes the audio player and stops playback.