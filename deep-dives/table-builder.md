
# [Table Builder](https://www.servicenow.com/docs/r/application-development/form-builder-glide-family-release/tb-landing-page.html)

# ServiceNow Table Builder: Overview & Core Capabilities

The **ServiceNow Table Builder** is an all-in-one, modern low-code developer interface built into the ServiceNow platform. It consolidates multiple scattered data management tasks—such as creating database schemas, altering dictionary fields, configuring visual form layouts, and declaring dynamic display rules—into a single, unified visual design canvas.

---

## 🚀 Core Capabilities

Table Builder combines data design and form layouts into three distinct operational workspaces:

* **Data Tab (Schema & Spreadsheet Views):** Provides flexible ways to structure data. 
    * *Fields/Spreadsheet View:* Enables developers to review, add, and alter columns or row records in a [familiar spreadsheet grid layout](https://www.servicenow.com/docs/r/application-development/form-builder-glide-family-release/tb-sprdsht-view.html).
    * *Schema View:* Graphically visualizes table-to-table dependencies, foreign references, and parent-child extensions.
* **Forms Tab (Visual Form Editor):** Allows you to drag and drop elements directly from your table—as well as dot-walked fields from referenced tables—to [visually create and customize user form views](https://www.servicenow.com/docs/r/xanadu/application-development/form-builder-glide-family-release/form-view-configuration.html).
* **Display Logic & Rule Automation:** Embeds conditional UI policies, client-facing alerts, and field requirements straight into the data layer without hopping over to legacy platform menus.

---

## 🏗️ Premium Features: Table Builder for App Engine

For instances configured with App Engine v2 licenses, a premium variant expands the tool into an integrated automation powerhouse:

* **Integrated Micro-Flows:** Build localized execution logic and Flow Designer triggers directly attached to table creation or updates right from the workspace.
* **PDF Structural Extractor:** Automatically reads physical or digital form documents, mapping the text inputs into structural database schemas and matching columns automatically.
* **App Engine Ecosystem Binding:** Connects cleanly into other App Engine frameworks (like **Workspace Builder** and **Flow Templates**), unifying document ingestion, data staging, and process mapping in a single workspace.

---

## 🧠 Traditional Platform vs. Table Builder

Historically, setting up a new data track in ServiceNow forced builders to jump between completely separate platform layers. Table Builder solves this overhead:

| Development Action | Legacy ServiceNow Pattern 🏛️ | Modern Table Builder Flow ⚡ |
| :--- | :--- | :--- |
| **Field Creation** | Done via System Dictionary or Tables module. | Created on-the-fly inside the Spreadsheet / Fields canvas. |
| **Form Formatting** | Managed separately in the Form Design tool. | Configured simultaneously inside the companion Forms tab. |
| **Field Constraints** | Written in separate Client Scripts or UI Policies. | Applied natively within the built-in Display Logic engine. |

---

## 🚶‍♂️ Access and Navigation Path

Table Builder can be launched directly through several primary application development routes:

* **Via App Engine Studio (AES):** Open your scoped application from the AES dashboard, locate your data track under the **Data** section, and click **Edit**.
* **Via UI Builder (UIB):** When configuring form or list widgets inside UIB, click the **Edit form view** button located at the bottom of the Configuration pane to seamlessly [launch Table Builder](https://www.servicenow.com/docs/r/washingtondc/application-development/form-builder/accessing-form-builder.html).
* **Direct Access:** Search for **Table Builder** within the All filter navigator to initiate an independent data session.
