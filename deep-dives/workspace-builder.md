# [Workspace Builder](https://www.servicenow.com/docs/r/application-development/workspace-builder/workspace-builder-landing.html)

# ServiceNow Workspace Builder: Overview & Core Capabilities

The **ServiceNow Workspace Builder** is a dedicated, **no-code visualization tool** integrated within the ServiceNow platform. It allows citizen developers and business analysts to design, configure, and customize modern digital workspaces using intuitive visual clicks rather than writing complex code lines.

---

## 🚀 Core Capabilities

The tool focuses on streamlining three primary design areas of a user's working interface:

* **Dynamic Homepages & Dashboards:** Allows you to drag, drop, and configure UI components—including interactive filters, data visualizations, images, and static text blocks—to build tailored home landing screens.
* **Role-Based Filtered Lists:** Enables you to construct specific list categories and filtered data grids so that fulfillers see exactly the records and assignments relevant to their organizational roles.
* **Contextual Record Layouts:** Provides direct layout control over record pages, allowing you to manage the visibility of the primary form, Activity Stream, related lists, Playbooks, Response Templates, attachments, and the Agent Assist sidebar.

---

## 🏗️ Workspace Builder vs. UI Builder (UIB)

While both tools are used to construct user interfaces, they target completely different developer personas and complexity levels:

| Functional Attribute | Workspace Builder 🛠️ | UI Builder (UIB) 📐 |
| :--- | :--- | :--- |
| **Target Persona** | No-code / Citizen Developers & Analysts. | Pro-code Developers & UX Architects. |
| **Customization Depth** | Modifies predefined out-of-the-box template zones (Home, Lists, Record Sidebars). | Modifies every individual component, event handler, client script, and data binding from scratch. |
| **Workflow Speed** | Rapid scaffolding; layout adjustments are constrained to a safe, guided framework. | Granular control; provides full freedom over custom page routing, parameters, and variants. |

*Note: For modern platform versions, you can use Workspace Builder for fast, primary layout edits and use the built-in shortcut to open that same workspace in **UI Builder** for advanced programmatic logic modifications.*

---

## 🚶‍♂️ Access and Navigation Path

Workspace Builder is accessed via the platform's scoped application engines. To launch it:

1. Navigate to **All > App Engine > App Engine Studio (AES)**.
2. Open your scoped application from the **My Apps** dashboard.
3. Locate the **Experience** section where your workspace experience is defined.
4. Click the **Additional Actions (three dots)** menu icon next to your workspace and select **Edit**.
5. The interface launches the visual Workspace Builder canvas where you can immediately rearrange widgets, edit tables, and alter filter configurations.
