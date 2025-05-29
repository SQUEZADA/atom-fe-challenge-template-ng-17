import { Component, Inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { CommonModule } from "@angular/common"; 
import { MaterialImports } from "../material-imports"; 

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmButtonText: string;
  cancelButtonText: string;
}

@Component({
  selector: "app-confirm-dialog",
  standalone: true, 
  imports: [
    CommonModule,
    ...MaterialImports
  ],
  templateUrl: "./confirm-dialog.component.html",
  styleUrl: "./confirm-dialog.component.scss"
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}

  onConfirmClick(): void {
    this.dialogRef.close(true); 
  }

  onCancelClick(): void {
    this.dialogRef.close(false);
  }
}