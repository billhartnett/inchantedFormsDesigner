export interface FormLayout {
  fields: any[];
  checkboxes: any[];
}

export interface FormDocument {
  id: string;
  formName: string;
  description: string;
  createdAt: string;
  currentLayout: FormLayout;
}
