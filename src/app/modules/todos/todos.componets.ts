import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MaterialImports } from "../../shared/material-imports";

@Component({
    selector: "app-login",
    standalone: true,
    imports: [
        CommonModule,
        ...MaterialImports
    ],
    templateUrl: "./todos.component.html",
    styleUrl: "./todos.component.scss"
})
export class TodosComponent { }