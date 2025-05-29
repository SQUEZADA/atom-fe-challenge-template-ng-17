import { Routes } from "@angular/router";

export const routes: Routes = [
    {
        path: "",
        redirectTo: "/login",
        pathMatch: "full",
    },
    {
        path: "login",
        loadComponent: () =>
            import("./modules/login/login.componets").then((m) => m.LoginComponent),
    },
    {
        path: "todos",
        loadComponent: () =>
            import("./modules/todos/todos.componets").then((m) => m.TodosComponent),
    },
    {
        path: "**",
        redirectTo: "/login",
    },
];
